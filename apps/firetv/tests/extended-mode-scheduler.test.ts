import { renderHook, act } from '@testing-library/react-native';
import { Description, SubtitleCue } from '@narratv/contracts';
import { useScheduler, UseSchedulerReturn } from '../src/features/player/domain/use-scheduler';
import { ITtsAdapter, SpeakCallbacks } from '../src/features/player/data/tts-adapter';

class FakeTts implements ITtsAdapter {
  spoken: string[] = [];
  stops = 0;
  cb: SpeakCallbacks = {};
  speaking = false;

  async speak(text: string, _audioUrl?: string, callbacks: SpeakCallbacks = {}) {
    this.spoken.push(text);
    this.cb = callbacks;
    this.speaking = true;
  }
  async stop() {
    this.stops += 1;
    this.speaking = false;
  }
  async isSpeaking() {
    return this.speaking;
  }
  becomeAudible() {
    this.cb.onStart?.();
  }
  finish() {
    this.speaking = false;
    this.cb.onDone?.();
  }
  error() {
    this.speaking = false;
    this.cb.onError?.();
  }
}

const subtitles: SubtitleCue[] = [
  { id: 1, tStart: 10.0, tEnd: 13.0, text: 'Dialogue line 1' },
  { id: 2, tStart: 20.0, tEnd: 23.0, text: 'Dialogue line 2' }
];

const normalDesc: Description = {
  id: 'desc-normal',
  tStart: 2.0,
  tEnd: 6.0,
  durationSec: 3.5,
  text: 'A solitary figure trudges through a blizzard.',
  confidence: 0.95,
  frameRef: 'f1.png',
  model: 'fixture',
  status: 'ai-draft'
};

const tightDesc: Description = {
  id: 'desc-tight',
  tStart: 8.0,
  tEnd: 10.0,
  durationSec: 4.0,
  text: 'The dragon circles low over the snowbound valley.',
  confidence: 0.95,
  frameRef: 'f2.png',
  model: 'fixture',
  status: 'ai-draft'
};

const extendedDesc: Description = {
  id: 'desc-extended',
  tStart: 13.0,
  tEnd: 17.5,
  durationSec: 4.5,
  text: 'Sintel draws her curved blade, inspecting the notches along the steel.',
  confidence: 0.95,
  frameRef: 'f3.png',
  model: 'fixture',
  status: 'ai-draft',
  isExtended: true,
  pausePoint: 13.3
};

const longNineSecDesc: Description = {
  id: 'desc-9sec',
  tStart: 25.0,
  tEnd: 34.0,
  durationSec: 9.0, // Exceeds 8.0s hardcoded constant to prove dynamic watchdog
  text: 'An exceptionally long and detailed audio description line describing every fold in her cloak and the ancient symbols carved deep into the icy monolith standing before her.',
  confidence: 0.95,
  frameRef: 'f4.png',
  model: 'fixture',
  status: 'ai-draft',
  isExtended: true,
  pausePoint: 25.3
};

interface SetupOptions {
  extendedEnabled?: boolean;
  onPausePlayback?: () => void;
  onResumePlayback?: () => void;
  tts?: ITtsAdapter;
}

function setup(descriptions: Description[], options: SetupOptions = {}) {
  return renderHook<UseSchedulerReturn, { t: number }>(
    ({ t }: { t: number }) =>
      useScheduler({
        descriptions,
        subtitles,
        currentTimeSec: t,
        isPlaying: true,
        adEnabled: true,
        extendedEnabled: options.extendedEnabled,
        onPausePlayback: options.onPausePlayback,
        onResumePlayback: options.onResumePlayback,
        tts: options.tts
      }),
    { initialProps: { t: 0 } }
  );
}

describe('Criterion C — Player Hook Tests (useScheduler Extended Mode)', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('Case 1: Extended OFF: when playhead hits unplaced description, refused as no-gap, film plays, TTS NOT called', () => {
    const tts = new FakeTts();
    let pauseCalls = 0;

    const { result, rerender } = setup([tightDesc], {
      extendedEnabled: false,
      onPausePlayback: () => {
        pauseCalls++;
      },
      tts
    });

    // Hit the slot for tightDesc (tStart: 8.0, cue at 10.0, needed 4.0s > 2.0s room)
    act(() => rerender({ t: 8.1 }));

    // Refused as no-gap
    expect(result.current.refusal?.reason).toBe('no-gap');
    expect(result.current.refusal?.description.id).toBe(tightDesc.id);

    // Film keeps playing (pause never called)
    expect(pauseCalls).toBe(0);

    // TTS is NOT called
    expect(tts.spoken).toHaveLength(0);
    expect(result.current.isExtendedPaused).toBe(false);
  });

  test('Case 2: Extended ON, normal description: film keeps playing, TTS speaks concurrent, pause NOT entered', () => {
    const tts = new FakeTts();
    let pauseCalls = 0;

    const { result, rerender } = setup([normalDesc], {
      extendedEnabled: true,
      onPausePlayback: () => {
        pauseCalls++;
      },
      tts
    });

    // Normal desc fits in [2.0, 6.0], cue is at 10.0
    act(() => rerender({ t: 2.1 }));

    // Film keeps playing: onPausePlayback not called
    expect(pauseCalls).toBe(0);
    expect(result.current.isExtendedPaused).toBe(false);
    expect(result.current.extendedPauseDescription).toBeNull();

    // TTS speaks concurrent with film
    expect(tts.spoken).toEqual([normalDesc.text]);
  });

  test('Case 3: Extended ON, extended description: pause at safe point, pill active, TTS speaks, resume on done, pill clears', () => {
    const tts = new FakeTts();
    let pauseCalls = 0;
    let resumeCalls = 0;

    const { result, rerender } = setup([extendedDesc], {
      extendedEnabled: true,
      onPausePlayback: () => {
        pauseCalls++;
      },
      onResumePlayback: () => {
        resumeCalls++;
      },
      tts
    });

    // Playhead reaches pausePoint: 13.3
    act(() => rerender({ t: 13.3 }));

    // a. Film pauses
    expect(pauseCalls).toBe(1);

    // b. Pill state becomes active
    expect(result.current.isExtendedPaused).toBe(true);
    expect(result.current.extendedPauseDescription?.id).toBe(extendedDesc.id);

    // c. TTS speak is dispatched
    expect(tts.spoken).toEqual([extendedDesc.text]);

    // TTS becomes audible
    act(() => tts.becomeAudible());
    expect(result.current.isNarrating).toBe(true);

    // d. Speech completes
    act(() => tts.finish());

    // Film resumes
    expect(resumeCalls).toBe(1);

    // e. Pill state clears
    expect(result.current.isExtendedPaused).toBe(false);
    expect(result.current.extendedPauseDescription).toBeNull();
    expect(result.current.isNarrating).toBe(false);
  });

  describe('Case 4: Viewer never stuck on TTS error / timeout', () => {
    test('4a: TTS adapter errors during extended pause -> film resumes within margin, error surfaced', () => {
      const tts = new FakeTts();
      let resumeCalls = 0;

      const { result, rerender } = setup([extendedDesc], {
        extendedEnabled: true,
        onResumePlayback: () => {
          resumeCalls++;
        },
        tts
      });

      act(() => rerender({ t: 13.3 }));
      expect(result.current.isExtendedPaused).toBe(true);

      // TTS errors
      act(() => tts.error());

      // Film resumes
      expect(resumeCalls).toBe(1);
      expect(result.current.isExtendedPaused).toBe(false);
      expect(result.current.extendedPauseDescription).toBeNull();

      // Error is surfaced, never swallowed
      expect(result.current.refusal?.reason).toBe('no-gap');
      expect(result.current.refusal?.description.id).toBe(extendedDesc.id);
    });

    test('4b & 4c: Dynamic watchdog derived per description (>8s line does not cut off at 8000ms, fires at 12000ms)', () => {
      const tts = new FakeTts();
      let resumeCalls = 0;

      // longNineSecDesc has durationSec: 9.0s
      // Dynamic watchdog: (9.0 + 3.0) * 1000 = 12000ms
      const { result, rerender } = setup([longNineSecDesc], {
        extendedEnabled: true,
        onResumePlayback: () => {
          resumeCalls++;
        },
        tts
      });

      act(() => rerender({ t: 25.3 }));
      expect(result.current.isExtendedPaused).toBe(true);

      // Advance by 8000ms: if hardcoded 8s watchdog existed, it would cut off.
      // With dynamic watchdog (12000ms), it MUST still be paused and speaking!
      act(() => jest.advanceTimersByTime(8000));
      expect(result.current.isExtendedPaused).toBe(true);
      expect(resumeCalls).toBe(0);

      // Advance past 12000ms watchdog
      act(() => jest.advanceTimersByTime(4100));

      // Watchdog fires: film resumes, stops speech, error surfaced
      expect(resumeCalls).toBe(1);
      expect(result.current.isExtendedPaused).toBe(false);
      expect(tts.stops).toBeGreaterThan(0);
      expect(result.current.refusal?.reason).toBe('no-gap');
      expect(result.current.refusal?.description.id).toBe(longNineSecDesc.id);
    });
  });

  describe('Case 5: Viewer interrupt during extended pause', () => {
    test('5a: Viewer presses play/pause while paused for extended description -> speech stops, film resumes', () => {
      const tts = new FakeTts();
      let resumeCalls = 0;

      const { result, rerender } = setup([extendedDesc], {
        extendedEnabled: true,
        onResumePlayback: () => {
          resumeCalls++;
        },
        tts
      });

      act(() => rerender({ t: 13.3 }));
      expect(result.current.isExtendedPaused).toBe(true);
      expect(tts.spoken).toHaveLength(1);

      // Viewer interrupts playback (presses play/pause)
      act(() => result.current.interruptExtendedPause());

      // Speech stops
      expect(tts.stops).toBeGreaterThan(0);

      // Film resumes
      expect(resumeCalls).toBe(1);

      // Extended pause clears
      expect(result.current.isExtendedPaused).toBe(false);
      expect(result.current.extendedPauseDescription).toBeNull();
    });

    test('5b: Viewer presses back / seek -> speech stops, extended pause clears, control returns to viewer', () => {
      const tts = new FakeTts();

      const { result, rerender } = setup([extendedDesc], {
        extendedEnabled: true,
        tts
      });

      act(() => rerender({ t: 13.3 }));
      expect(result.current.isExtendedPaused).toBe(true);

      // Viewer seeks backwards to 5.0s
      act(() => rerender({ t: 5.0 }));

      // Speech stops
      expect(tts.stops).toBeGreaterThan(0);

      // Extended pause clears
      expect(result.current.isExtendedPaused).toBe(false);
      expect(result.current.extendedPauseDescription).toBeNull();
    });
  });

  test('Case 6: a pause window swallowed by dialogue is refused out loud once the line ends - never paused mid-line, never silently lost', () => {
    // pausePoint 9.5 is clear, but the window runs to 10.3 and the player samples
    // the clock in steps. A sample at 10.2 is inside the line that starts at 10.0,
    // where rule 1 (dialogue priority) returns early. Before this test existed the
    // description then vanished: the window passed during the line, so it was
    // neither spoken nor refused.
    const lateDesc: Description = { ...extendedDesc, id: 'desc-late-tick', tStart: 9.5, tEnd: 12.0, pausePoint: 9.5 };
    const tts = new FakeTts();
    let pauseCalls = 0;
    const { result, rerender } = setup([lateDesc], {
      extendedEnabled: true,
      onPausePlayback: () => { pauseCalls++; },
      tts
    });
    for (const t of [10.2, 11.0, 12.0, 12.9]) {
      act(() => rerender({ t }));
      expect(pauseCalls).toBe(0);
      expect(tts.spoken).toEqual([]);
    }
    act(() => rerender({ t: 13.2 }));
    expect(pauseCalls).toBe(0);
    expect(result.current.isExtendedPaused).toBe(false);
    expect(tts.spoken).toEqual([]);
    expect(result.current.refusal?.description.id).toBe('desc-late-tick');
    expect(result.current.refusal?.reason).toBe('dialogue-active');
  });
});
