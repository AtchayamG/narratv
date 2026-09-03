import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { TimelineSurface } from '../src/features/player/presentation/TimelineSurface';
import { Description, SubtitleCue } from '@narratv/contracts';

describe('TimelineSurface Component (Judge-Visible Proof Map)', () => {
  const mockSubtitles: SubtitleCue[] = [
    { id: 1, tStart: 5.0, tEnd: 9.0, text: 'Hello, welcome to Sintel.' }
  ];

  const mockDescriptions: Description[] = [
    {
      id: 'desc-1',
      tStart: 0.5,
      tEnd: 4.5,
      text: 'A girl walks silently through snow.',
      confidence: 0.94,
      frameRef: 'sintel/frame_001.jpg',
      model: 'amazon.nova-pro-v1:0',
      status: 'ai-draft',
      placementRule: 'Gap 0.0–4.7s (4.7s) fits 7 words (3.1s)'
    },
    {
      id: 'desc-skipped-1',
      tStart: 5.5,
      tEnd: 8.5,
      text: 'Candidate description during dialogue.',
      confidence: 0.85,
      frameRef: 'sintel/frame_005.jpg',
      model: 'amazon.nova-pro-v1:0',
      status: 'skipped',
      skipReason: 'no-gap',
      placementRule: 'No dialogue-free gap ≥ 2.5s available at 5.5s'
    }
  ];

  test('renders dialogue, scheduled narration, and skipped refusal blocks', () => {
    render(
      <TimelineSurface
        descriptions={mockDescriptions}
        subtitles={mockSubtitles}
        currentTimeSec={2.0}
        durationSec={60.0}
        onSelectDescription={jest.fn()}
      />
    );

    expect(screen.getByText('Deterministic Narration Timeline')).toBeTruthy();
    expect(screen.getByText('Dialogue')).toBeTruthy();
    expect(screen.getByText('AI Draft AD')).toBeTruthy();
    expect(screen.getByText('Skipped: no-gap')).toBeTruthy();
    expect(screen.getByText('A girl walks silently through snow.')).toBeTruthy();
    expect(screen.getByText('Hello, welcome to Sintel.')).toBeTruthy();
  });
});
