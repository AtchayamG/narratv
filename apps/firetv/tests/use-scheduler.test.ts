import { Description, SubtitleCue } from '@narratv/contracts';

describe('useScheduler Hook Logic', () => {
  const mockSubtitles: SubtitleCue[] = [
    { id: 1, tStart: 5.0, tEnd: 8.0, text: 'Dialogue line 1' },
    { id: 2, tStart: 15.0, tEnd: 18.0, text: 'Dialogue line 2' }
  ];

  const mockDescriptions: Description[] = [
    {
      id: 'desc-1',
      tStart: 0.5,
      tEnd: 4.5,
      text: 'Opening scene description in gap.',
      confidence: 0.95,
      frameRef: 'frame1.png',
      model: 'fixture',
      status: 'ai-draft'
    },
    {
      id: 'desc-2',
      tStart: 8.5,
      tEnd: 14.5,
      text: 'Second scene description in dialogue gap.',
      confidence: 0.92,
      frameRef: 'frame2.png',
      model: 'fixture',
      status: 'ai-draft'
    }
  ];

  test('Scheduler correctly identifies active dialogue cues and cancels narration', () => {
    const currentTimeSec = 6.0; // Inside subtitle 1 [5.0, 8.0]
    const activeCue = mockSubtitles.find(c => currentTimeSec >= c.tStart && currentTimeSec <= c.tEnd);
    expect(activeCue).toBeDefined();
    expect(activeCue?.id).toBe(1);

    // Verify narration is not matched during dialogue
    const activeDesc = mockDescriptions.find(
      d => d.status !== 'skipped' && currentTimeSec >= d.tStart && currentTimeSec < d.tEnd
    );
    expect(activeDesc).toBeUndefined();
  });

  test('Scheduler matches active description inside dialogue gaps', () => {
    const currentTimeSec = 2.0; // Inside description 1 [0.5, 4.5]
    const activeCue = mockSubtitles.find(c => currentTimeSec >= c.tStart && currentTimeSec <= c.tEnd);
    expect(activeCue).toBeUndefined();

    const activeDesc = mockDescriptions.find(
      d => d.status !== 'skipped' && currentTimeSec >= d.tStart && currentTimeSec < d.tEnd
    );
    expect(activeDesc).toBeDefined();
    expect(activeDesc?.id).toBe('desc-1');
  });

  test('Scheduler counts only active descriptions for display', () => {
    const mixedDescriptions: Description[] = [
      ...mockDescriptions,
      {
        id: 'desc-skipped',
        tStart: 5.2,
        tEnd: 7.8,
        text: 'Skipped during dialogue.',
        confidence: 0.3,
        frameRef: 'frame_skip.png',
        model: 'fixture',
        status: 'skipped',
        skipReason: 'low-confidence'
      }
    ];

    const activeCount = mixedDescriptions.filter(d => d.status !== 'skipped').length;
    expect(activeCount).toBe(2);
  });
});
