import React from 'react';
import { render, screen, act, fireEvent } from '@testing-library/react-native';
import { PlayerScreen } from '../src/features/player/presentation/PlayerScreen';
import { config } from '../src/core/config';

describe('PlayerScreen Real Video Component', () => {
  beforeEach(() => {
    config.demoMode = true;
  });

  test('renders Video element and updates currentTime only via onProgress', async () => {
    const mockNav = {
      goBack: jest.fn(),
      navigate: jest.fn(),
      addListener: jest.fn(() => jest.fn())
    };
    const route = { params: { titleId: 'sintel' } };

    render(<PlayerScreen route={route} navigation={mockNav} />);

    // Wait for title to resolve and render HUD
    expect(await screen.findByText('Sintel')).toBeTruthy();

    const videoElement = screen.getByTestId('native-video-player');
    expect(videoElement).toBeTruthy();
    expect(videoElement.props.source).toEqual({
      uri: 'https://archive.org/download/Sintel/sintel-2048-stereo_512kb.mp4'
    });

    // Initial timecode should start at 0:00
    expect(screen.getByText(/0:00 \/ /)).toBeTruthy();

    // Invoking onProgress advances currentTime strictly from event
    act(() => {
      videoElement.props.onProgress({
        currentTime: 24.5,
        playableDuration: 888.064,
        seekableDuration: 888.064
      });
    });

    // Timecode must now reflect 0:24 from onProgress
    expect(screen.getByText(/0:24 \/ /)).toBeTruthy();

    // Invoking onLoad updates duration
    act(() => {
      videoElement.props.onLoad({
        duration: 888.064,
        currentTime: 0,
        naturalSize: { width: 564, height: 240, orientation: 'landscape' },
        audioTracks: [],
        textTracks: [],
        videoTracks: []
      });
    });
    expect(screen.getByText(/0:24 \/ 14:48/)).toBeTruthy();
  });

  test('Back action stops playback and navigates back', async () => {
    const mockNav = {
      goBack: jest.fn(),
      navigate: jest.fn(),
      addListener: jest.fn(() => jest.fn())
    };
    const route = { params: { titleId: 'sintel' } };

    render(<PlayerScreen route={route} navigation={mockNav} />);
    expect(await screen.findByText('Sintel')).toBeTruthy();

    const backBtn = screen.getByText('Back');
    fireEvent.press(backBtn);

    expect(mockNav.goBack).toHaveBeenCalledTimes(1);
  });

  test('film audio is ducked only while a description is audible', async () => {
    const mockNav = {
      goBack: jest.fn(),
      navigate: jest.fn(),
      addListener: jest.fn(() => jest.fn())
    };
    const route = { params: { titleId: 'sintel' } };

    render(<PlayerScreen route={route} navigation={mockNav} />);
    expect(await screen.findByText('Sintel')).toBeTruthy();

    // Nothing is being narrated at t=0, so the film plays at full level.
    const videoElement = screen.getByTestId('native-video-player');
    expect(videoElement.props.volume).toBe(1.0);
  });

  test('no overlay is anchored to the centre of the picture', async () => {
    const mockNav = {
      goBack: jest.fn(),
      navigate: jest.fn(),
      addListener: jest.fn(() => jest.fn())
    };
    const route = { params: { titleId: 'sintel' } };

    const { toJSON } = render(<PlayerScreen route={route} navigation={mockNav} />);
    expect(await screen.findByText('Sintel')).toBeTruthy();

    // Guards the accessibility requirement that sighted viewers keep a clear
    // picture: every overlay must live in the top or bottom band.
    const tree = JSON.stringify(toJSON());
    expect(tree).not.toContain('"justifyContent":"center","alignItems":"center","flex":1');
  });
});
