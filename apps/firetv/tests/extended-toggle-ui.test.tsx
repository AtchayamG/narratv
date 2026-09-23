import { render, screen, act, fireEvent } from '@testing-library/react-native';
import { PlayerScreen } from '../src/features/player/presentation/PlayerScreen';
import { config } from '../src/core/config';
import * as accessibility from '../src/core/accessibility';

describe('Extended Mode Toggle UI & 10-Foot Accessibility (PlayerScreen)', () => {
  const mockNav = {
    goBack: jest.fn(),
    navigate: jest.fn(),
    addListener: jest.fn(() => jest.fn())
  };
  const route = { params: { titleId: 'sintel' } };

  beforeEach(() => {
    config.demoMode = true;
    jest.clearAllMocks();
  });

  test('default state is Extended OFF, displays 42 AD / 2 skipped / 13 gaps in top HUD', async () => {
    const { unmount } = render(<PlayerScreen route={route} navigation={mockNav} />);

    expect(await screen.findByText('Sintel')).toBeTruthy();

    // Default Extended button should be "Extended off"
    const extendedBtn = screen.getByText('Extended off');
    expect(extendedBtn).toBeTruthy();

    // Top HUD counter reflects default (extended OFF): 42 AD, 2 skipped
    expect(screen.getByText(/42 AD · 2 skipped · 13 gaps/)).toBeTruthy();

    unmount();
  });

  test('button has 10-foot focusability and accessible labels', async () => {
    const { unmount } = render(<PlayerScreen route={route} navigation={mockNav} />);
    expect(await screen.findByText('Sintel')).toBeTruthy();

    const extendedBtn = screen.getByText('Extended off');
    expect(extendedBtn).toBeTruthy();

    // Fire focus event
    fireEvent(extendedBtn, 'focus');

    // Check accessible properties
    const pressable = screen.getByRole('button', { name: /Extended audio descriptions disabled\. Press to enable\./i });
    expect(pressable).toBeTruthy();

    unmount();
  });

  test('toggling Extended mode updates button label, screen reader announcement, and top HUD', async () => {
    const announceSpy = jest.spyOn(accessibility, 'announceForAccessibility');

    const { unmount } = render(<PlayerScreen route={route} navigation={mockNav} />);
    expect(await screen.findByText('Sintel')).toBeTruthy();

    const extendedBtn = screen.getByText('Extended off');

    // Toggle Extended ON
    await act(async () => {
      fireEvent.press(extendedBtn);
    });

    // Button label is now "Extended on"
    expect(await screen.findByText('Extended on')).toBeTruthy();

    // Screen reader announcement made
    expect(announceSpy).toHaveBeenCalledWith(
      expect.stringContaining('Extended audio descriptions enabled')
    );

    // Top HUD reflects extended mode: 42 AD, 2 extended, 13 gaps
    expect(screen.getByText(/42 AD · 2 extended · 13 gaps/)).toBeTruthy();

    // Toggle back OFF
    const onBtn = screen.getByText('Extended on');
    await act(async () => {
      fireEvent.press(onBtn);
    });

    expect(await screen.findByText('Extended off')).toBeTruthy();
    expect(screen.getByText(/42 AD · 2 skipped · 13 gaps/)).toBeTruthy();

    unmount();
  });

  test('shows "PAUSED FOR DESCRIPTION" pill when playback enters extended pause', async () => {
    const { unmount } = render(<PlayerScreen route={route} navigation={mockNav} />);
    expect(await screen.findByText('Sintel')).toBeTruthy();

    // Toggle Extended ON
    const extendedBtn = screen.getByText('Extended off');
    await act(async () => {
      fireEvent.press(extendedBtn);
    });
    expect(await screen.findByText('Extended on')).toBeTruthy();

    const videoElement = screen.getByTestId('native-video-player');

    // Simulate playhead reaching sintel-ad-11's pause point: 146.8 s, its own frame
    act(() => {
      videoElement.props.onProgress({
        currentTime: 146.8,
        playableDuration: 888.064,
        seekableDuration: 888.064
      });
    });

    // "PAUSED FOR DESCRIPTION" pill should now be on screen
    expect(await screen.findByText('PAUSED FOR DESCRIPTION')).toBeTruthy();

    unmount();
  });
});
