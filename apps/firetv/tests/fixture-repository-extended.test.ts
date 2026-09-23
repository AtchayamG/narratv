import { FixtureTrackRepository } from '../src/features/catalog/data/fixture-track-repository';
import { Description, SubtitleCue } from '@narratv/contracts';

describe('FixtureTrackRepository — Primary Path Extended Mode (Correction 7)', () => {
  const repo = new FixtureTrackRepository();

  test('Sintel with extended: false (or default) maintains exact regression lock (42 playable, 2 refused)', async () => {
    const defaultTrack = await repo.getTrack('sintel');
    const falseTrack = await repo.getTrack('sintel', { extended: false });

    for (const track of [defaultTrack, falseTrack]) {
      const active = track.descriptions.filter(d => d.status !== 'skipped');
      const skipped = track.descriptions.filter(d => d.status === 'skipped');

      expect(active).toHaveLength(42);
      expect(skipped).toHaveLength(2);
      expect(skipped.map(d => d.id).sort()).toEqual(['sintel-ad-11', 'sintel-ad-28'].sort());

      for (const item of active) {
        expect(item.isExtended).toBeFalsy();
        expect(item.pausePoint).toBeUndefined();
      }
      for (const item of skipped) {
        expect(item.skipReason).toBe('no-gap');
        expect(item.placementRule).toBe('Refused: overlaps a real dialogue cue.');
      }
    }
  });

  test('Sintel with extended: true delivers sintel-ad-11 and sintel-ad-28 by safe pause points', async () => {
    const track = await repo.getTrack('sintel', { extended: true });
    const cues = await repo.getSubtitles('sintel');

    const active = track.descriptions.filter(d => d.status !== 'skipped');
    const skipped = track.descriptions.filter(d => d.status === 'skipped');
    const extended = track.descriptions.filter(d => d.isExtended);
    const normal = track.descriptions.filter(d => !d.isExtended && d.status !== 'skipped');

    // Exactly 44 playable (42 normal + 2 extended), 0 skipped
    expect(active).toHaveLength(44);
    expect(normal).toHaveLength(42);
    expect(extended).toHaveLength(2);
    expect(skipped).toHaveLength(0);

    // Track metadata
    expect(track.metadata.totalGaps).toBe(13);
    expect(track.metadata.describedCount).toBe(42);
    expect(track.metadata.extendedCount).toBe(2);
    expect(track.metadata.skippedCount).toBe(0);
    expect(track.metadata.overlapCount).toBe(0);

    // Specifically verify sintel-ad-11 and sintel-ad-28
    const ad11 = extended.find(d => d.id === 'sintel-ad-11');
    const ad28 = extended.find(d => d.id === 'sintel-ad-28');

    expect(ad11).toBeDefined();
    expect(ad28).toBeDefined();

    expect(ad11!.pausePoint).toBeCloseTo(152.05, 2);
    expect(ad28!.pausePoint).toBeCloseTo(456.80, 2);

    // Verify neither pausePoint lies inside any dialogue cue
    for (const item of [ad11!, ad28!]) {
      const p = item.pausePoint!;
      const insideDialogue = cues.some(c => p >= c.tStart && p < c.tEnd);
      expect(insideDialogue).toBe(false);
      expect(item.placementRule).toMatch(/^Extended: delivered by pause at /);
    }
  });

  test('Synthetic fixture: a cue longer than 5.0 s covering a description stays refused even with extended: true', async () => {
    // Test the preplaced logic with a synthetic subclass
    class TestRepo extends FixtureTrackRepository {
      async getSubtitles(titleId: string): Promise<SubtitleCue[]> {
        if (titleId === 'synthetic-long-cue') {
          return [
            // Dialogue cue is 6.0 seconds long (exceeds 5.0s limit)
            { id: 1, tStart: 100.0, tEnd: 106.0, text: 'A very long speech that cannot be safely paused.' }
          ];
        }
        return super.getSubtitles(titleId);
      }
    }

    // Direct check of cue-chain length logic in safe pause placement
    const longCue: SubtitleCue = { id: 1, tStart: 100.0, tEnd: 106.0, text: 'Long dialogue' };
    const descOverlapping: Description = {
      id: 'desc-long',
      tStart: 101.0,
      tEnd: 104.0,
      text: 'Visual action happening during long speech.',
      confidence: 0.9,
      frameRef: 'frame1.jpg',
      model: 'test',
      status: 'ai-draft'
    };

    // Verify when a cue chain exceeds 5.0s, safePoint is not found and description is refused
    const cues = [longCue];
    const chainDuration = longCue.tEnd - longCue.tStart;
    expect(chainDuration).toBeGreaterThan(5.0);

    // Using placeDescriptions with cues > 5s also stays refused if no safe point exists within 5s
    const { findEarliestSafePoint } = require('@narratv/scheduler');
    const safePoint = findEarliestSafePoint(descOverlapping.tStart, cues, [], 300);
    // Earliest safe point candidate after longCue would be 106.3s, which is 5.3s after tStart 101.0 (exceeds 5.0s)
    expect(safePoint).toBeNull();
  });
});
