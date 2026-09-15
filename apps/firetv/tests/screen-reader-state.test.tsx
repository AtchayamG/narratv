import { render, screen, act } from '@testing-library/react-native';
import { SystemStatusScreen } from '../src/features/settings/presentation/SystemStatusScreen';
import { MovieRail } from '../src/features/catalog/presentation/MovieRail';
import { PlayerScreen } from '../src/features/player/presentation/PlayerScreen';
import { Title } from '@narratv/contracts';
import { config, setDemoMode } from '../src/core/config';

describe('D5 — Screen-Reader State and Live Region Invariants', () => {
  const sintelTitle: Title = {
    id: 'sintel',
    name: 'Sintel',
    synopsis: 'A lonely young warrior woman searches across harsh landscapes.',
    durationSec: 888,
    rating: 'PG',
    genre: 'Fantasy / Animation',
    year: 2010,
    videoUrl: 'https://example.com/sintel.mp4',
    license: 'CC-BY 3.0 (Blender Foundation)'
  };

  const bbbTitle: Title = {
    id: 'big-buck-bunny',
    name: 'Big Buck Bunny',
    synopsis: 'A large and gentle rabbit deals with forest bullies.',
    durationSec: 596,
    rating: 'G',
    genre: 'Animation / Comedy',
    year: 2008,
    videoUrl: 'https://example.com/bbb.mp4',
    license: 'CC-BY 3.0 (Blender Foundation)'
  };

  beforeEach(() => {
    config.demoMode = true;
  });

  describe('SystemStatusScreen Accessibility State', () => {
    test('mode toggle reports accessibilityState.checked based on active runtime mode', async () => {
      const mockNav = { navigate: jest.fn(), goBack: jest.fn() };
      setDemoMode(true);

      const { UNSAFE_root } = render(<SystemStatusScreen navigation={mockNav} />);
      expect(await screen.findByText('System Status & Transparency')).toBeTruthy();

      const toggleBtn = UNSAFE_root.findAll((node: any) =>
        node.props && node.props.accessibilityLabel && node.props.accessibilityLabel.includes('Switch to')
      )[0];

      expect(toggleBtn).toBeDefined();
      // In demoMode (demo=true), checked is false (not live)
      expect(toggleBtn.props.accessibilityState).toMatchObject({ checked: false });
    });

    test('Refresh Status button reports accessibilityState disabled and busy flags', async () => {
      const mockNav = { navigate: jest.fn(), goBack: jest.fn() };
      const { UNSAFE_root } = render(<SystemStatusScreen navigation={mockNav} />);
      expect(await screen.findByText('System Status & Transparency')).toBeTruthy();

      const refreshBtn = UNSAFE_root.findAll((node: any) =>
        node.props && node.props.accessibilityLabel === 'Refresh system health status'
      )[0];

      expect(refreshBtn).toBeDefined();
      expect(refreshBtn.props.accessibilityState).toHaveProperty('disabled', false);
      expect(refreshBtn.props.accessibilityState).toHaveProperty('busy', false);
    });
  });

  describe('MovieRail Selection State', () => {
    test('indicates selected: true on the active title card and selected: false on unselected cards', () => {
      const { UNSAFE_root } = render(
        <MovieRail
          title="Open Cinema"
          items={[sintelTitle, bbbTitle]}
          selectedTitleId="sintel"
          onSelectTitle={jest.fn()}
          onFocusTitle={jest.fn()}
        />
      );

      const cards = UNSAFE_root.findAll((node: any) =>
        node.props && node.props.accessibilityRole === 'button' && typeof node.props.onPress === 'function'
      );

      expect(cards).toHaveLength(2);
      // Sintel is selected
      expect(cards[0].props.accessibilityState).toMatchObject({ selected: true });
      // Big Buck Bunny is not selected
      expect(cards[1].props.accessibilityState).toMatchObject({ selected: false });
    });
  });

  describe('PlayerScreen Controls State and Live Regions', () => {
    test('playback controls declare proper accessibilityState (selected, checked, expanded)', async () => {
      const mockNav = { navigate: jest.fn(), goBack: jest.fn() };
      const route = { params: { titleId: 'sintel' } };
      const { UNSAFE_root } = render(<PlayerScreen route={route} navigation={mockNav} />);

      expect(await screen.findByText('Sintel')).toBeTruthy();

      // Play/Pause button declares selected: isPlaying
      const playBtn = UNSAFE_root.findAll((node: any) =>
        node.props && (node.props.accessibilityLabel === 'Pause video' || node.props.accessibilityLabel === 'Play video')
      )[0];
      expect(playBtn).toBeDefined();
      expect(playBtn.props.accessibilityState).toMatchObject({ selected: true });

      // AD toggle button declares checked: true (enabled by default for Sintel)
      const adBtn = UNSAFE_root.findAll((node: any) =>
        node.props && node.props.accessibilityLabel && node.props.accessibilityLabel.includes('Audio description is')
      )[0];
      expect(adBtn).toBeDefined();
      expect(adBtn.props.accessibilityState).toMatchObject({ checked: true, disabled: false });

      // Timeline button declares expanded: false initially
      const timelineBtn = UNSAFE_root.findAll((node: any) =>
        node.props && node.props.accessibilityLabel && node.props.accessibilityLabel.includes('Toggle Timeline surface')
      )[0];
      expect(timelineBtn).toBeDefined();
      expect(timelineBtn.props.accessibilityState).toMatchObject({ expanded: false });

      // Toggle timeline and verify expanded flips to true
      act(() => {
        timelineBtn.props.onPress();
      });
      expect(timelineBtn.props.accessibilityState).toMatchObject({ expanded: true });
    });

    test('narration strip declares accessibilityLiveRegion="polite" when audio description is speaking', async () => {
      const fakeTts = {
        speak: jest.fn((_text: string, _url?: string, callbacks?: any) => {
          callbacks?.onStart?.();
          return Promise.resolve();
        }),
        stop: jest.fn(() => Promise.resolve()),
        isSpeaking: jest.fn(() => Promise.resolve(true)),
        getLeadInSec: () => 0.6,
        seedLeadIn: () => {}
      };

      const mockNav = { navigate: jest.fn(), goBack: jest.fn() };
      const route = { params: { titleId: 'sintel' } };
      const { UNSAFE_root } = render(<PlayerScreen route={route} navigation={mockNav} ttsAdapter={fakeTts} />);

      expect(await screen.findByText('Sintel')).toBeTruthy();

      const videoElement = screen.getByTestId('native-video-player');

      // Video must be ready for playback
      act(() => {
        videoElement.props.onReadyForDisplay();
      });

      // Advance clock to target narration dispatch window
      await act(async () => {
        videoElement.props.onProgress({
          currentTime: 2.1,
          playableDuration: 888.0,
          seekableDuration: 888.0
        });
      });

      const narrationStrip = UNSAFE_root.findAll((node: any) =>
        node.props && node.props.accessibilityLiveRegion === 'polite'
      );
      expect(narrationStrip.length).toBeGreaterThanOrEqual(1);
      expect(narrationStrip[0].props.accessibilityLabel).toMatch(/Audio description:/i);
    });

    test('refusal indicator declares accessibilityLiveRegion="assertive" when candidate description is skipped', async () => {
      const fakeTts = {
        speak: jest.fn((_text: string, _url?: string, callbacks?: any) => {
          callbacks?.onStart?.();
          return Promise.resolve();
        }),
        stop: jest.fn(() => Promise.resolve()),
        isSpeaking: jest.fn(() => Promise.resolve(true)),
        getLeadInSec: () => 0.6,
        seedLeadIn: () => {}
      };

      const mockNav = { navigate: jest.fn(), goBack: jest.fn() };
      const route = { params: { titleId: 'sintel' } };
      const { UNSAFE_root } = render(<PlayerScreen route={route} navigation={mockNav} ttsAdapter={fakeTts} />);

      expect(await screen.findByText('Sintel')).toBeTruthy();

      const videoElement = screen.getByTestId('native-video-player');

      act(() => {
        videoElement.props.onReadyForDisplay();
      });

      // Start narration at 2.1s
      await act(async () => {
        videoElement.props.onProgress({
          currentTime: 2.1,
          playableDuration: 888.0,
          seekableDuration: 888.0
        });
      });

      // Now clock jumps directly into dialogue (Sintel first subtitle at 106.95s - 108.85s)
      await act(async () => {
        videoElement.props.onProgress({
          currentTime: 108.0,
          playableDuration: 888.0,
          seekableDuration: 888.0
        });
      });

      const refusalStrip = UNSAFE_root.findAll((node: any) =>
        node.props && node.props.accessibilityLiveRegion === 'assertive'
      );
      expect(refusalStrip.length).toBeGreaterThanOrEqual(1);
      expect(refusalStrip[0].props.accessibilityLabel).toMatch(/Description stopped: dialogue started\./i);
    });
  });
});
