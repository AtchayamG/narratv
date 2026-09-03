import { computeOverlaps, computeTrackCounters } from '../src/counters';
import { Description, SubtitleCue, Gap } from '@narratv/contracts';

describe('Scheduler Counters & Overlap Auditor', () => {
  test('detects and logs overlapping descriptions with dialogue cues', () => {
    const overlappingDesc: Description[] = [
      {
        id: 'desc-overlap',
        tStart: 5.5,
        tEnd: 8.5,
        text: 'This description overlaps dialogue.',
        confidence: 0.9,
        frameRef: 'frame.jpg',
        model: 'test',
        status: 'ai-draft'
      }
    ];

    const cues: SubtitleCue[] = [
      { id: 1, tStart: 5.0, tEnd: 8.0, text: 'Dialogue text' }
    ];

    const result = computeOverlaps(overlappingDesc, cues);
    expect(result.overlapCount).toBe(1);
    expect(result.overlaps[0].descriptionId).toBe('desc-overlap');
    expect(result.overlaps[0].cueId).toBe(1);
  });

  test('computes counters with skipped reasons', () => {
    const descriptions: Description[] = [
      {
        id: 'desc-1',
        tStart: 0,
        tEnd: 3,
        text: 'Active',
        confidence: 0.9,
        frameRef: 'f1.jpg',
        model: 'test',
        status: 'ai-draft'
      },
      {
        id: 'desc-2',
        tStart: 5,
        tEnd: 8,
        text: 'Skipped low conf',
        confidence: 0.4,
        frameRef: 'f2.jpg',
        model: 'test',
        status: 'skipped',
        skipReason: 'low-confidence'
      },
      {
        id: 'desc-3',
        tStart: 10,
        tEnd: 12,
        text: 'Skipped custom reason',
        confidence: 0.8,
        frameRef: 'f3.jpg',
        model: 'test',
        status: 'skipped',
        skipReason: 'custom-reason'
      }
    ];

    const gaps: Gap[] = [
      { id: 'g1', tStart: 0, tEnd: 4, duration: 4 }
    ];

    const counters = computeTrackCounters(descriptions, gaps, []);
    expect(counters.totalGaps).toBe(1);
    expect(counters.describedCount).toBe(1);
    expect(counters.skippedCount).toBe(2);
    expect(counters.skippedByReason['low-confidence']).toBe(1);
    expect(counters.skippedByReason['custom-reason']).toBe(1);
  });
});
