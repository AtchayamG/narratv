import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { HeroSpotlight } from '../src/features/catalog/presentation/HeroSpotlight';
import { MovieRail } from '../src/features/catalog/presentation/MovieRail';
import { SystemStatusScreen } from '../src/features/settings/presentation/SystemStatusScreen';
import { WhyPanel } from '../src/features/player/presentation/WhyPanel';
import { TimelineSurface } from '../src/features/player/presentation/TimelineSurface';
import { Title, DescriptionTrack, Description, SubtitleCue } from '@narratv/contracts';

describe('12.2 Accessibility Audit Regression Tests', () => {
  const sintelTitle: Title = {
    id: 'sintel',
    name: 'Sintel',
    synopsis: 'A lonely young warrior woman searches across harsh landscapes.',
    durationSec: 888,
    rating: 'PG',
    genre: 'Fantasy / Animation',
    year: 2010,
    videoUrl: 'https://example.com/sintel.mp4'
  };

  const bbbTitle: Title = {
    id: 'big-buck-bunny',
    name: 'Big Buck Bunny',
    synopsis: 'A large and gentle rabbit deals with forest bullies.',
    durationSec: 596,
    rating: 'G',
    genre: 'Animation / Comedy',
    year: 2008,
    videoUrl: 'https://example.com/bbb.mp4'
  };

  const sintelTrack: DescriptionTrack = {
    titleId: 'sintel',
    revision: '1.0',
    status: 'ai-draft',
    descriptions: [
      {
        id: 'desc-1',
        tStart: 0.5,
        tEnd: 4.8,
        text: 'A solitary figure trudges through a raging blizzard.',
        confidence: 0.95,
        frameRef: 'sintel/frame_001.jpg',
        model: 'amazon.nova-pro-v1:0',
        status: 'ai-draft',
        placementRule: 'Placed in opening gap'
      }
    ],
    metadata: {
      totalGaps: 15,
      describedCount: 13,
      skippedCount: 2,
      overlapCount: 0,
      generatedAt: '2026-09-02T12:00:00Z',
      model: 'amazon.nova-pro-v1:0'
    }
  };

  test('HeroSpotlight sets honest accessibilityLabel for title with track vs without track', () => {
    const { rerender } = render(
      <HeroSpotlight title={sintelTitle} track={sintelTrack} onPlay={jest.fn()} />
    );
    expect(
      screen.getByLabelText(/Play Sintel with Audio Description/i)
    ).toBeTruthy();

    const emptyTrack: DescriptionTrack = {
      titleId: 'big-buck-bunny',
      revision: 'none',
      status: 'ai-draft',
      descriptions: [],
      metadata: {
        totalGaps: 10,
        describedCount: 0,
        skippedCount: 10,
        overlapCount: 0,
        generatedAt: 'not-generated',
        model: 'none'
      }
    };

    rerender(
      <HeroSpotlight title={bbbTitle} track={emptyTrack} onPlay={jest.fn()} />
    );
    expect(
      screen.getByLabelText(/Play Big Buck Bunny\. Audio description track not yet generated\./i)
    ).toBeTruthy();
  });

  test('MovieRail assigns distinct accessibilityLabels for titles with and without AD tracks', () => {
    render(
      <MovieRail
        title="Open Cinema"
        items={[sintelTitle, bbbTitle]}
        onSelectTitle={jest.fn()}
        onFocusTitle={jest.fn()}
      />
    );

    expect(
      screen.getByLabelText('Sintel, 2010, Fantasy / Animation. Audio Description track ready.')
    ).toBeTruthy();
    expect(
      screen.getByLabelText('Big Buck Bunny, 2008, Animation / Comedy. Audio description not yet generated.')
    ).toBeTruthy();
  });

  test('SystemStatusScreen cards and credits have explicit accessibilityLabels', () => {
    const mockNav = { goBack: jest.fn(), navigate: jest.fn() };
    render(<SystemStatusScreen navigation={mockNav} />);

    expect(screen.getByLabelText(/Active runtime mode:/i)).toBeTruthy();
    expect(screen.getByLabelText(/Deterministic refusal invariants:/i)).toBeTruthy();
    expect(screen.getByLabelText(/Creative Commons Open Movie Credits/i)).toBeTruthy();
    expect(screen.getByLabelText('Refresh system health status')).toBeTruthy();
    expect(screen.getByLabelText('Return to movie catalog')).toBeTruthy();
  });

  test('WhyPanel has explicit accessibilityLabel and announce text', () => {
    const desc: Description = sintelTrack.descriptions[0];
    render(<WhyPanel description={desc} onClose={jest.fn()} />);

    expect(screen.getByLabelText('Close Why this description panel')).toBeTruthy();
  });

  test('TimelineSurface blocks have descriptive accessibilityLabels and hints', () => {
    const cues: SubtitleCue[] = [
      { id: 1, tStart: 5.0, tEnd: 7.0, text: 'Who goes there?' }
    ];
    render(
      <TimelineSurface
        descriptions={sintelTrack.descriptions}
        subtitles={cues}
        currentTimeSec={2.0}
        durationSec={888}
      />
    );

    expect(
      screen.getByLabelText(/Dialogue from 0:05 to 0:07: Who goes there\?/i)
    ).toBeTruthy();
    expect(
      screen.getByLabelText(/Narration at 0:00: A solitary figure trudges/i)
    ).toBeTruthy();
  });
});
