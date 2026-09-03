import React from 'react';
import { render, screen, waitFor } from '@testing-library/react-native';
import { FixtureTrackRepository } from '../src/features/catalog/data/fixture-track-repository';
import { PlayerScreen } from '../src/features/player/presentation/PlayerScreen';
import { container } from '../src/core/di';

describe('12.1 Titles Without Description Track', () => {
  let repo: FixtureTrackRepository;

  beforeEach(() => {
    repo = new FixtureTrackRepository();
    container.trackRepository = repo;
  });

  test('big-buck-bunny returns 0 descriptions, 0 overlaps, model none, and never generates fake descriptions', async () => {
    const track = await repo.getTrack('big-buck-bunny');

    expect(track.titleId).toBe('big-buck-bunny');
    expect(track.descriptions).toHaveLength(0);
    expect(track.metadata.describedCount).toBe(0);
    expect(track.metadata.overlapCount).toBe(0);
    expect(track.metadata.model).toBe('none');
    expect(track.metadata.generatedAt).toBe('not-generated');
  });

  test('elephants-dream returns 0 descriptions, 0 overlaps, model none, and never generates fake descriptions', async () => {
    const track = await repo.getTrack('elephants-dream');

    expect(track.titleId).toBe('elephants-dream');
    expect(track.descriptions).toHaveLength(0);
    expect(track.metadata.describedCount).toBe(0);
    expect(track.metadata.overlapCount).toBe(0);
    expect(track.metadata.model).toBe('none');
    expect(track.metadata.generatedAt).toBe('not-generated');
  });

  test('PlayerScreen for big-buck-bunny renders honest empty state without crashing', async () => {
    const mockNav = { goBack: jest.fn(), navigate: jest.fn() };

    render(
      <PlayerScreen
        route={{ params: { titleId: 'big-buck-bunny' } }}
        navigation={mockNav}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Big Buck Bunny')).toBeTruthy();
    });

    expect(screen.getByText('NO AD TRACK')).toBeTruthy();
    expect(screen.getByText('AD n/a')).toBeTruthy();
    expect(screen.getByText(/Film plays normally/i)).toBeTruthy();
    expect(screen.queryByText(/Scene action continues smoothly/i)).toBeNull();
  });

  test('PlayerScreen for elephants-dream renders honest empty state without crashing', async () => {
    const mockNav = { goBack: jest.fn(), navigate: jest.fn() };

    render(
      <PlayerScreen
        route={{ params: { titleId: 'elephants-dream' } }}
        navigation={mockNav}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Elephants Dream')).toBeTruthy();
    });

    expect(screen.getByText('NO AD TRACK')).toBeTruthy();
    expect(screen.getByText('AD n/a')).toBeTruthy();
    expect(screen.getByText(/Film plays normally/i)).toBeTruthy();
    expect(screen.queryByText(/Scene action continues smoothly/i)).toBeNull();
  });
});
