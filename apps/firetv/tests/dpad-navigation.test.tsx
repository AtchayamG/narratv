import { render, screen } from '@testing-library/react-native';
import { CatalogScreen } from '../src/features/catalog/presentation/CatalogScreen';
import { PlayerScreen } from '../src/features/player/presentation/PlayerScreen';
import { SystemStatusScreen } from '../src/features/settings/presentation/SystemStatusScreen';
import { HeroSpotlight } from '../src/features/catalog/presentation/HeroSpotlight';
import { MovieRail } from '../src/features/catalog/presentation/MovieRail';
import { TimelineSurface } from '../src/features/player/presentation/TimelineSurface';
import { WhyPanel } from '../src/features/player/presentation/WhyPanel';
import { Title, DescriptionTrack, SubtitleCue } from '@narratv/contracts';
import { config } from '../src/core/config';

type TestInstance = ReturnType<typeof render>['UNSAFE_root'];

describe('D4 — 10-Foot D-Pad Reachability and Spatial Focus Invariants', () => {
  const sampleTitle: Title = {
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

  const sampleTrack: DescriptionTrack = {
    titleId: 'sintel',
    revision: '1.0',
    status: 'ai-draft',
    descriptions: [
      {
        id: 'desc-1',
        tStart: 1.0,
        tEnd: 4.5,
        text: 'A solitary figure trudges through a blizzard.',
        confidence: 0.95,
        frameRef: 'sintel/frame_001.jpg',
        model: 'amazon.nova-pro-v1:0',
        status: 'ai-draft',
        placementRule: 'Placed in opening gap'
      }
    ],
    metadata: {
      totalGaps: 12,
      describedCount: 10,
      skippedCount: 2,
      overlapCount: 0,
      generatedAt: '2026-09-02T12:00:00Z',
      model: 'amazon.nova-pro-v1:0'
    }
  };

  const sampleSubtitles: SubtitleCue[] = [
    {
      id: 1,
      tStart: 5.0,
      tEnd: 8.0,
      text: 'What are you doing here?'
    }
  ];

  beforeEach(() => {
    config.demoMode = true;
  });

  /**
   * Discovers all interactive control nodes in a rendered component tree.
   * On React Native TV, interactive elements receive onPress or define button role.
   */
  function findInteractiveElements(root: TestInstance): TestInstance[] {
    return root.findAll((node: any) => {
      if (!node.props) return false;
      const hasOnPress = typeof node.props.onPress === 'function';
      const isButtonRole = node.props.accessibilityRole === 'button';
      return hasOnPress && isButtonRole;
    });
  }

  /**
   * Helper that asserts TV navigation invariants on a set of interactive elements:
   * 1. Every element is actually reachable by the D-pad (focusable === true),
   *    unless it is deliberately inert (accessibilityState.disabled === true).
   * 2. Every element is exposed to the screen reader (accessible === true).
   * 3. Every element has a non-empty, non-whitespace accessibilityLabel.
   *
   * NOTE ON (1): this used to read
   *     `focusable === true || accessible === true`
   * which could never fail, because Button and FocusableCard both hardcode
   * `accessible={true}`. Setting `focusable={false}` on every Button in the app
   * -- making every control unreachable by D-pad -- left all 9 tests in this
   * file green across 5 consecutive runs. The two properties are now asserted
   * separately so that losing either one fails the suite.
   */
  function verifyInteractiveElements(elements: TestInstance[]) {
    expect(elements.length).toBeGreaterThan(0);
    for (const el of elements) {
      const label = el.props.accessibilityLabel;
      const deliberatelyInert = el.props.accessibilityState?.disabled === true;

      if (!deliberatelyInert) {
        // Reachability is the claim this file makes; assert it on its own.
        expect(el.props.focusable).toBe(true);
      }
      // Screen-reader exposure is a separate claim; assert it on its own.
      expect(el.props.accessible).toBe(true);

      expect(typeof label).toBe('string');
      expect(label.trim().length).toBeGreaterThan(0);
    }
  }

  /**
   * Asserts that across the given tree, exactly one interactive control carries hasTVPreferredFocus={true}.
   */
  function verifySinglePreferredFocus(elements: TestInstance[]) {
    const preferredFocusNodes = elements.filter(el => el.props.hasTVPreferredFocus === true);
    expect(preferredFocusNodes).toHaveLength(1);
  }

  describe('Screen-Level D-Pad Navigation', () => {
    test('CatalogScreen: all controls are focusable, labelled, and exactly one preferred focus node exists', async () => {
      const mockNav = { navigate: jest.fn(), goBack: jest.fn() };
      const { UNSAFE_root } = render(<CatalogScreen navigation={mockNav} />);

      expect(await screen.findByText('NarraTV')).toBeTruthy();

      const interactive = findInteractiveElements(UNSAFE_root);
      // Catalog has: Header Status button, Hero Play button, Hero Status button, plus movie rail cards
      expect(interactive.length).toBeGreaterThanOrEqual(5);

      verifyInteractiveElements(interactive);
      verifySinglePreferredFocus(interactive);

      // Verify the single preferred focus is the Hero spotlight Play button
      const preferred = interactive.find(el => el.props.hasTVPreferredFocus === true);
      expect(preferred?.props.accessibilityLabel).toMatch(/Play Sintel with Audio Description/i);
    });

    test('PlayerScreen: all controls are focusable, labelled, and initial focus lands on Play/Pause', async () => {
      const mockNav = { navigate: jest.fn(), goBack: jest.fn() };
      const route = { params: { titleId: 'sintel' } };
      const { UNSAFE_root } = render(<PlayerScreen route={route} navigation={mockNav} />);

      expect(await screen.findByText('Sintel')).toBeTruthy();

      const interactive = findInteractiveElements(UNSAFE_root);
      // Play, AD toggle, Describe Now, Timeline, Back
      expect(interactive.length).toBeGreaterThanOrEqual(5);

      verifyInteractiveElements(interactive);
      verifySinglePreferredFocus(interactive);

      const preferred = interactive.find(el => el.props.hasTVPreferredFocus === true);
      expect(preferred?.props.accessibilityLabel).toMatch(/Pause video|Play video/i);
    });

    test('SystemStatusScreen: all controls are focusable, labelled, and initial focus lands on mode toggle', async () => {
      const mockNav = { navigate: jest.fn(), goBack: jest.fn() };
      const { UNSAFE_root } = render(<SystemStatusScreen navigation={mockNav} />);

      expect(await screen.findByText('System Status & Transparency')).toBeTruthy();

      const interactive = findInteractiveElements(UNSAFE_root);
      // Mode toggle button, Refresh Status button, Back to Catalog button
      expect(interactive.length).toBeGreaterThanOrEqual(3);

      verifyInteractiveElements(interactive);
      verifySinglePreferredFocus(interactive);

      const preferred = interactive.find(el => el.props.hasTVPreferredFocus === true);
      expect(preferred?.props.accessibilityLabel).toMatch(/Switch to live mode|Switch to demo mode/i);
    });
  });

  describe('Component-Level D-Pad Navigation', () => {
    test('HeroSpotlight: interactive buttons are accessible with exactly one preferred focus when active', () => {
      const { UNSAFE_root } = render(
        <HeroSpotlight
          title={sampleTitle}
          track={sampleTrack}
          onPlay={jest.fn()}
          onOpenSystemStatus={jest.fn()}
          hasTVPreferredFocus={true}
        />
      );

      const interactive = findInteractiveElements(UNSAFE_root);
      expect(interactive.length).toBe(2); // Play button + Status button
      verifyInteractiveElements(interactive);
      verifySinglePreferredFocus(interactive);
    });

    test('MovieRail: all movie cards are focusable with labels, and first card takes preferred focus if requested', () => {
      const { UNSAFE_root } = render(
        <MovieRail
          title="Open Cinema"
          items={[sampleTitle, { ...sampleTitle, id: 'bbb', name: 'Big Buck Bunny' }]}
          onSelectTitle={jest.fn()}
          onFocusTitle={jest.fn()}
          hasTVPreferredFocus={true}
        />
      );

      const interactive = findInteractiveElements(UNSAFE_root);
      expect(interactive.length).toBe(2);
      verifyInteractiveElements(interactive);
      verifySinglePreferredFocus(interactive);
      expect(interactive[0].props.hasTVPreferredFocus).toBe(true);
      expect(interactive[1].props.hasTVPreferredFocus).toBe(false);
    });

    test('TimelineSurface: timeline blocks are focusable with labels, and first block takes preferred focus if requested', () => {
      const { UNSAFE_root } = render(
        <TimelineSurface
          descriptions={sampleTrack.descriptions}
          subtitles={sampleSubtitles}
          currentTimeSec={2.0}
          durationSec={888}
          hasTVPreferredFocus={true}
          onSelectDescription={jest.fn()}
        />
      );

      const interactive = findInteractiveElements(UNSAFE_root);
      expect(interactive.length).toBe(2); // 1 description + 1 dialogue
      verifyInteractiveElements(interactive);
      verifySinglePreferredFocus(interactive);
      expect(interactive[0].props.hasTVPreferredFocus).toBe(true);
      expect(interactive[1].props.hasTVPreferredFocus).toBe(false);
    });

    test('WhyPanel: close button is accessible and carries initial focus', () => {
      const { UNSAFE_root } = render(
        <WhyPanel
          description={sampleTrack.descriptions[0]}
          onClose={jest.fn()}
        />
      );

      const interactive = findInteractiveElements(UNSAFE_root);
      expect(interactive.length).toBe(1);
      verifyInteractiveElements(interactive);
      verifySinglePreferredFocus(interactive);
      expect(interactive[0].props.accessibilityLabel).toMatch(/Close Why this description/i);
    });
  });

  describe('D-Pad Spatial Navigation Routing Continuity', () => {
    test('CatalogScreen navigation paths between header, hero actions, and rail cards are unbroken', async () => {
      const mockNav = { navigate: jest.fn(), goBack: jest.fn() };
      const { UNSAFE_root } = render(<CatalogScreen navigation={mockNav} />);
      expect(await screen.findByText('NarraTV')).toBeTruthy();

      const interactive = findInteractiveElements(UNSAFE_root);
      // Header button
      const headerBtn = interactive.find(el => el.props.accessibilityLabel?.includes('view AWS and API connectivity'));
      expect(headerBtn).toBeDefined();

      // Hero buttons
      const heroPlayBtn = interactive.find(el => el.props.accessibilityLabel?.includes('Play Sintel'));
      const heroStatusBtn = interactive.find(el => el.props.accessibilityLabel?.includes('AWS Transparency Diagnostics'));
      expect(heroPlayBtn).toBeDefined();
      expect(heroStatusBtn).toBeDefined();

      // Rail cards
      const railCards = interactive.filter(el => el.props.accessibilityHint?.includes('Press Select to view details'));
      expect(railCards.length).toBeGreaterThanOrEqual(3);
    });

    test('PlayerScreen control bar provides unbroken horizontal navigation sequence', async () => {
      const mockNav = { navigate: jest.fn(), goBack: jest.fn() };
      const route = { params: { titleId: 'sintel' } };
      const { UNSAFE_root } = render(<PlayerScreen route={route} navigation={mockNav} />);
      expect(await screen.findByText('Sintel')).toBeTruthy();

      const interactive = findInteractiveElements(UNSAFE_root);
      const labels = interactive.map(el => el.props.accessibilityLabel);

      expect(labels[0]).toMatch(/Pause video|Play video/i);
      expect(labels[1]).toMatch(/Audio description is/i);
      expect(labels[2]).toMatch(/Extended audio descriptions/i);
      expect(labels[3]).toMatch(/Describe Now/i);
      expect(labels[4]).toMatch(/Toggle Timeline/i);
      expect(labels[5]).toMatch(/Back to movie catalog/i);
    });
  });
});
