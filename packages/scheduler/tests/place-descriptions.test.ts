import { placeDescriptions, estimateNarrationDuration } from '../src/place-descriptions';
import { Gap, Description } from '@narratv/contracts';

describe('Description Placement Engine', () => {
  const mockGaps: Gap[] = [
    { id: 'gap-0', tStart: 0, tEnd: 4.5, duration: 4.5 },
    { id: 'gap-1', tStart: 10.0, tEnd: 15.0, duration: 5.0 }
  ];

  test('places valid draft into matching gap', () => {
    const drafts: Description[] = [
      {
        id: 'desc-1',
        tStart: 0.5,
        tEnd: 3.5,
        text: 'A girl walks silently.',
        confidence: 0.95,
        frameRef: 'frame1.jpg',
        model: 'amazon.nova-pro-v1:0',
        status: 'ai-draft'
      }
    ];

    const result = placeDescriptions(mockGaps, drafts);
    expect(result.scheduled).toHaveLength(1);
    expect(result.skipped).toHaveLength(0);
    expect(result.scheduled[0].tStart).toBe(0);
    expect(result.scheduled[0].placementRule).toContain('fits');
  });

  test('handles human-rejected description', () => {
    const drafts: Description[] = [
      {
        id: 'desc-rejected',
        tStart: 0.5,
        tEnd: 3.5,
        text: 'A rejected scene description.',
        confidence: 0.95,
        frameRef: 'frame_rej.jpg',
        model: 'amazon.nova-pro-v1:0',
        status: 'skipped',
        skipReason: 'human-rejected'
      }
    ];

    const result = placeDescriptions(mockGaps, drafts);
    expect(result.scheduled).toHaveLength(0);
    expect(result.skipped).toHaveLength(1);
    expect(result.skipped[0].skipReason).toBe('human-rejected');
    expect(result.counters.skippedByReason['human-rejected']).toBe(1);
  });

  test('handles model-invalid empty description', () => {
    const drafts: Description[] = [
      {
        id: 'desc-invalid',
        tStart: 0.5,
        tEnd: 3.5,
        text: '   ',
        confidence: 0.95,
        frameRef: 'frame_inv.jpg',
        model: 'amazon.nova-pro-v1:0',
        status: 'ai-draft'
      }
    ];

    const result = placeDescriptions(mockGaps, drafts);
    expect(result.scheduled).toHaveLength(0);
    expect(result.skipped).toHaveLength(1);
    expect(result.skipped[0].skipReason).toBe('model-invalid');
  });

  test('skips description with confidence below threshold', () => {
    const drafts: Description[] = [
      {
        id: 'desc-low-conf',
        tStart: 0.5,
        tEnd: 3.5,
        text: 'A blurry figure appears.',
        confidence: 0.45, // < 0.6
        frameRef: 'frame_low.jpg',
        model: 'amazon.nova-pro-v1:0',
        status: 'ai-draft'
      }
    ];

    const result = placeDescriptions(mockGaps, drafts, { minConfidence: 0.6 });
    expect(result.scheduled).toHaveLength(0);
    expect(result.skipped).toHaveLength(1);
    expect(result.skipped[0].skipReason).toBe('low-confidence');
  });

  test('skips description when text is too long for the gap', () => {
    const drafts: Description[] = [
      {
        id: 'desc-too-long',
        tStart: 0.2,
        tEnd: 4.0,
        text: 'This is an extremely detailed and long description that contains way too many words to possibly be read out loud within a short four second gap on screen.',
        confidence: 0.9,
        frameRef: 'frame_long.jpg',
        model: 'amazon.nova-pro-v1:0',
        status: 'ai-draft'
      }
    ];

    const result = placeDescriptions(mockGaps, drafts);
    expect(result.scheduled).toHaveLength(0);
    expect(result.skipped).toHaveLength(1);
    expect(result.skipped[0].skipReason).toBe('too-long');
  });

  test('skips description when no gap is available', () => {
    const drafts: Description[] = [
      {
        id: 'desc-no-gap',
        tStart: 50.0, // Gap is at 0-4.5 and 10-15
        tEnd: 54.0,
        text: 'A dragon flies overhead.',
        confidence: 0.9,
        frameRef: 'frame_dragon.jpg',
        model: 'amazon.nova-pro-v1:0',
        status: 'ai-draft'
      }
    ];

    const result = placeDescriptions(mockGaps, drafts);
    expect(result.scheduled).toHaveLength(0);
    expect(result.skipped).toHaveLength(1);
    expect(result.skipped[0].skipReason).toBe('no-gap');
  });

  test('estimates duration based on word count and handles empty text', () => {
    expect(estimateNarrationDuration('')).toBe(0);
    const text = 'Sintel looks up at the sky.';
    const duration = estimateNarrationDuration(text, 2.5); // 6 words / 2.5 = 2.4s + 0.3 = 2.7s
    expect(duration).toBeGreaterThanOrEqual(2.5);
  });
});
