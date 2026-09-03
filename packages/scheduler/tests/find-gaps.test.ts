import { findGaps, mergeSubtitleIntervals } from '../src/find-gaps';
import { SubtitleCue } from '@narratv/contracts';

describe('Gap Detector', () => {
  test('merges overlapping subtitle cues', () => {
    const cues: SubtitleCue[] = [
      { id: 1, tStart: 2.0, tEnd: 6.0, text: 'Cue 1' },
      { id: 2, tStart: 4.0, tEnd: 8.0, text: 'Cue 2 (overlaps 1)' },
      { id: 3, tStart: 12.0, tEnd: 15.0, text: 'Cue 3' }
    ];
    const merged = mergeSubtitleIntervals(cues);
    expect(merged).toEqual([
      { tStart: 2.0, tEnd: 8.0 },
      { tStart: 12.0, tEnd: 15.0 }
    ]);
  });

  test('detects gaps with minGapSec and guardMs bands', () => {
    const cues: SubtitleCue[] = [
      { id: 1, tStart: 5.0, tEnd: 8.0, text: 'Opening dialogue' },
      { id: 2, tStart: 14.0, tEnd: 16.0, text: 'Next dialogue' }
    ];

    // minGapSec = 2.5, guardMs = 300 (0.3s)
    // Initial gap: 0 to (5.0 - 0.3) = 4.7s -> valid gap
    // Intermediate gap: (8.0 + 0.3 = 8.3) to (14.0 - 0.3 = 13.7) = 5.4s -> valid gap
    // Final gap with totalDuration 25s: (16.0 + 0.3 = 16.3) to 25.0 = 8.7s -> valid gap
    const gaps = findGaps(cues, { minGapSec: 2.5, guardMs: 300, totalDurationSec: 25.0 });

    expect(gaps).toHaveLength(3);
    expect(gaps[0].tStart).toBe(0);
    expect(gaps[0].tEnd).toBe(4.7);
    expect(gaps[0].duration).toBe(4.7);

    expect(gaps[1].tStart).toBe(8.3);
    expect(gaps[1].tEnd).toBe(13.7);
    expect(gaps[1].duration).toBe(5.4);

    expect(gaps[2].tStart).toBe(16.3);
    expect(gaps[2].tEnd).toBe(25.0);
    expect(gaps[2].duration).toBe(8.7);
  });

  test('filters out gaps shorter than minGapSec', () => {
    const cues: SubtitleCue[] = [
      { id: 1, tStart: 1.0, tEnd: 3.0, text: 'Cue 1' },
      // Gap between 3.3 and 5.2 is 1.9s (< 2.5s) -> should be discarded
      { id: 2, tStart: 5.5, tEnd: 7.0, text: 'Cue 2' }
    ];

    const gaps = findGaps(cues, { minGapSec: 2.5, guardMs: 300 });
    // Initial gap is 0 to 0.7 (0.7s < 2.5s -> discarded)
    // Gap between 1 and 2 is 3.3 to 5.2 (1.9s < 2.5s -> discarded)
    expect(gaps).toHaveLength(0);
  });

  test('returns single full gap if no cues and total duration provided', () => {
    const gaps = findGaps([], { minGapSec: 2.5, totalDurationSec: 60.0 });
    expect(gaps).toHaveLength(1);
    expect(gaps[0].duration).toBe(60.0);
  });
});
