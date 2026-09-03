import fc from 'fast-check';
import { SubtitleCue, Description } from '@narratv/contracts';
import { findGaps } from '../src/find-gaps';
import { placeDescriptions } from '../src/place-descriptions';
import { computeOverlaps, computeTrackCounters } from '../src/counters';

describe('Deterministic Scheduler Invariants & Property Tests', () => {
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
      // Sort and construct valid non-negative sequential cues
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
      tStart: fc.double({ min: 0, max: 1200, noNaN: true }),
      text: fc.oneof(
        fc.constant('A short scene description.'),
        fc.constant('Sintel gazes across the distant snowy valley.'),
        fc.constant('The small dragon flutters its wings and rests on her hand.'),
        fc.constant('An exceptionally long detailed narration that should be skipped if the gap is too small.')
      ),
      confidence: fc.double({ min: 0.1, max: 1.0, noNaN: true }),
      frameRef: fc.constant('frame.png'),
      model: fc.constant('amazon.nova-pro-v1:0'),
      status: fc.constant('ai-draft' as const)
    }),
    { minLength: 1, maxLength: 30 }
  );

  test('PROPERTY TEST: zero placed descriptions intersect any dialogue cue (100 runs)', () => {
    fc.assert(
      fc.property(subtitleCueArbitrary, draftsArbitrary, (cues, rawDrafts) => {
        const drafts: Description[] = rawDrafts.map(d => ({
          ...d,
          tEnd: d.tStart + 3.0
        }));

        const gaps = findGaps(cues, { minGapSec: 2.5, guardMs: 300 });
        const placement = placeDescriptions(gaps, drafts, { minConfidence: 0.6 });

        // Check overlaps with dialogue cues
        const analysis = computeOverlaps(placement.scheduled, cues);

        // Mathematical invariant: overlap count MUST be 0
        expect(analysis.overlapCount).toBe(0);
        expect(analysis.overlaps).toHaveLength(0);

        // Audit counters
        const counters = computeTrackCounters(placement.scheduled, gaps, cues);
        expect(counters.overlapCount).toBe(0);
        expect(counters.describedCount).toBe(placement.scheduled.length);
      }),
      { numRuns: 100 }
    );
  });

  test('Guarantees 300ms guard band between narration and dialogue', () => {
    const cues: SubtitleCue[] = [
      { id: 1, tStart: 5.0, tEnd: 10.0, text: 'Dialogue 1' },
      { id: 2, tStart: 18.0, tEnd: 22.0, text: 'Dialogue 2' }
    ];

    const gaps = findGaps(cues, { minGapSec: 2.5, guardMs: 300 });
    // Gap 1 should be [10.3, 17.7]
    expect(gaps[1].tStart).toBeGreaterThanOrEqual(10.3);
    expect(gaps[1].tEnd).toBeLessThanOrEqual(17.7);

    const drafts: Description[] = [
      {
        id: 'desc-1',
        tStart: 11.0,
        tEnd: 14.0,
        text: 'The character observes the mountain.',
        confidence: 0.95,
        frameRef: 'f1.jpg',
        model: 'fixture',
        status: 'ai-draft'
      }
    ];

    const { scheduled } = placeDescriptions(gaps, drafts);
    expect(scheduled).toHaveLength(1);
    // Scheduled start should not precede 10.3s
    expect(scheduled[0].tStart).toBeGreaterThanOrEqual(10.3);
    // Scheduled end should not exceed 17.7s
    expect(scheduled[0].tEnd).toBeLessThanOrEqual(17.7);
  });
});
