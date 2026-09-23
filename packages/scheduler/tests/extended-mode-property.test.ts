import fc from 'fast-check';
import { SubtitleCue, Description } from '@narratv/contracts';
import { findGaps } from '../src/find-gaps';
import { placeDescriptions } from '../src/place-descriptions';
import { computeOverlaps } from '../src/counters';

describe('Extended Mode Property Tests (fast-check)', () => {
  // Arbitrary generator for SubtitleCue lists
  const subtitleCueArbitrary = fc
    .array(
      fc.record({
        id: fc.nat(),
        tStartOffset: fc.double({ min: 0, max: 10, noNaN: true }),
        duration: fc.double({ min: 0.5, max: 20, noNaN: true }),
        text: fc.string({ minLength: 1, maxLength: 50 })
      }),
      { minLength: 1, maxLength: 25 }
    )
    .map(rawCues => {
      let currentTime = 1.0;
      const validCues: SubtitleCue[] = [];
      for (const raw of rawCues) {
        const tStart = Math.round((currentTime + raw.tStartOffset) * 100) / 100;
        const tEnd = Math.round((tStart + raw.duration) * 100) / 100;
        validCues.push({
          id: raw.id,
          tStart,
          tEnd,
          text: raw.text || 'Dialogue text'
        });
        currentTime = tEnd + 1.0;
      }
      return validCues;
    });

  // Arbitrary generator for candidate description drafts
  const draftsArbitrary = fc.array(
    fc.record({
      id: fc.uuid(),
      tStart: fc.double({ min: 0, max: 600, noNaN: true }),
      text: fc.oneof(
        fc.constant('A short scene description.'),
        fc.constant('Sintel gazes across the distant snowy valley.'),
        fc.constant('The small dragon flutters its wings and rests on her hand.'),
        fc.constant('An exceptionally long detailed narration that would ordinarily be skipped.')
      ),
      confidence: fc.double({ min: 0.1, max: 1.0, noNaN: true }),
      frameRef: fc.constant('frame.png'),
      model: fc.constant('amazon.nova-pro-v1:0'),
      status: fc.constant('ai-draft' as const)
    }),
    { minLength: 1, maxLength: 30 }
  );

  test('Invariant 1: No pause point lies inside any dialogue cue (100 runs)', () => {
    fc.assert(
      fc.property(subtitleCueArbitrary, draftsArbitrary, (cues, rawDrafts) => {
        const drafts: Description[] = rawDrafts.map(d => ({
          ...d,
          tEnd: d.tStart + 3.0
        }));

        const gaps = findGaps(cues, { minGapSec: 2.5, guardMs: 300 });
        const placement = placeDescriptions(gaps, drafts, {
          minConfidence: 0.6,
          extended: true,
          cues
        });

        const extendedItems = placement.scheduled.filter(d => d.isExtended);
        for (const item of extendedItems) {
          expect(item.pausePoint).toBeDefined();
          const p = item.pausePoint!;
          // Must not fall within [cue.tStart, cue.tEnd) for any cue
          const insideCue = cues.some(c => p >= c.tStart && p < c.tEnd);
          expect(insideCue).toBe(false);
        }
      }),
      { numRuns: 100 }
    );
  });

  test('Invariant 2: No narration overlaps dialogue in extended mode (100 runs)', () => {
    fc.assert(
      fc.property(subtitleCueArbitrary, draftsArbitrary, (cues, rawDrafts) => {
        const drafts: Description[] = rawDrafts.map(d => ({
          ...d,
          tEnd: d.tStart + 3.0
        }));

        const gaps = findGaps(cues, { minGapSec: 2.5, guardMs: 300 });
        const placement = placeDescriptions(gaps, drafts, {
          minConfidence: 0.6,
          extended: true,
          cues
        });

        // Compute overlaps across all scheduled descriptions
        const analysis = computeOverlaps(placement.scheduled, cues);
        expect(analysis.overlapCount).toBe(0);
        expect(analysis.overlaps).toHaveLength(0);

        for (const desc of placement.scheduled) {
          if (!desc.isExtended) {
            // Normal placement: [desc.tStart, desc.tEnd] has no overlap with any cue
            for (const cue of cues) {
              const overlaps = desc.tStart < cue.tEnd && desc.tEnd > cue.tStart;
              expect(overlaps).toBe(false);
            }
          } else {
            // Extended placement: pausePoint is defined and not inside any cue
            expect(desc.pausePoint).toBeDefined();
            const inside = cues.some(c => desc.pausePoint! >= c.tStart && desc.pausePoint! < c.tEnd);
            expect(inside).toBe(false);
          }
        }
      }),
      { numRuns: 100 }
    );
  });

  test('Invariant 3: Quality gate preserved - low-confidence (<0.6) candidates are NEVER extended (100 runs)', () => {
    fc.assert(
      fc.property(
        subtitleCueArbitrary,
        fc.array(
          fc.record({
            id: fc.uuid(),
            tStart: fc.double({ min: 0, max: 600, noNaN: true }),
            text: fc.constant('Low confidence draft narration.'),
            confidence: fc.double({ min: 0.0, max: 0.59, noNaN: true }),
            frameRef: fc.constant('frame.png'),
            model: fc.constant('amazon.nova-pro-v1:0'),
            status: fc.constant('ai-draft' as const)
          }),
          { minLength: 1, maxLength: 20 }
        ),
        (cues, lowConfDrafts) => {
          const drafts: Description[] = lowConfDrafts.map(d => ({
            ...d,
            tEnd: d.tStart + 3.0
          }));

          const gaps = findGaps(cues, { minGapSec: 2.5, guardMs: 300 });
          const placement = placeDescriptions(gaps, drafts, {
            minConfidence: 0.6,
            extended: true,
            cues
          });

          // None of the low-confidence drafts should ever be scheduled or extended
          expect(placement.scheduled).toHaveLength(0);
          expect(placement.skipped).toHaveLength(drafts.length);
          for (const item of placement.skipped) {
            expect(item.status).toBe('skipped');
            expect(item.skipReason).toBe('low-confidence');
            expect(item.isExtended).toBeFalsy();
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Invariant 4: Quality gate preserved - human-rejected candidates are NEVER extended (100 runs)', () => {
    fc.assert(
      fc.property(
        subtitleCueArbitrary,
        fc.array(
          fc.record({
            id: fc.uuid(),
            tStart: fc.double({ min: 0, max: 600, noNaN: true }),
            text: fc.constant('Human rejected draft narration.'),
            confidence: fc.double({ min: 0.8, max: 1.0, noNaN: true }),
            frameRef: fc.constant('frame.png'),
            model: fc.constant('amazon.nova-pro-v1:0'),
            status: fc.constant('skipped' as const),
            skipReason: fc.constant('human-rejected')
          }),
          { minLength: 1, maxLength: 20 }
        ),
        (cues, rejectedDrafts) => {
          const drafts: Description[] = rejectedDrafts.map(d => ({
            ...d,
            tEnd: d.tStart + 3.0
          }));

          const gaps = findGaps(cues, { minGapSec: 2.5, guardMs: 300 });
          const placement = placeDescriptions(gaps, drafts, {
            minConfidence: 0.6,
            extended: true,
            cues
          });

          // None of the human-rejected drafts should ever be scheduled or extended
          expect(placement.scheduled).toHaveLength(0);
          expect(placement.skipped).toHaveLength(drafts.length);
          for (const item of placement.skipped) {
            expect(item.status).toBe('skipped');
            expect(item.skipReason).toBe('human-rejected');
            expect(item.isExtended).toBeFalsy();
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
