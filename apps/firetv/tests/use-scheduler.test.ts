import { renderHook, act } from '@testing-library/react-native';
import { Description, SubtitleCue } from '@narratv/contracts';
import {
  useScheduler,
  roomBeforeNextCue,
  LEAD_IN_SEC,
  TAIL_GUARD_SEC
} from '../src/features/player/domain/use-scheduler';
import { ITtsAdapter, SpeakCallbacks, estimateSpeechSec } from '../src/features/player/data/tts-adapter';

/**
 * A TTS double that models the thing the old implementation ignored:
 * device speech does not become audible the instant speak() is called.
 */
class FakeTts implements ITtsAdapter {
  spoken: string[] = [];
  stops = 0;
  private cb: SpeakCallbacks = {};
  private speaking = false;

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
  /** Simulate the synthesis engine becoming audible. */
  becomeAudible() {
    this.cb.onStart?.();
  }
  finish() {
    this.speaking = false;
    this.cb.onDone?.();
  }
}

const subtitles: SubtitleCue[] = [
  { id: 1, tStart: 10.0, tEnd: 13.0, text: 'Dialogue line 1' },
  { id: 2, tStart: 20.0, tEnd: 23.0, text: 'Dialogue line 2' }
];

const shortDesc: Description = {
  id: 'desc-fits',
  tStart: 2.0,
  tEnd: 6.0,
  text: 'A solitary figure trudges through a blizzard.', // 7 words ~= 3.2s
  confidence: 0.95,
  frameRef: 'f1.png',
  model: 'fixture',
  status: 'ai-draft'
};

const longDesc: Description = {
  id: 'desc-too-long',
  tStart: 8.5,
  tEnd: 10.0,
  text:
    'The camera pulls back across the frozen valley revealing a ruined stone city half buried ' +
    'in drifting snow while the wind tears at her tattered cloak and the light fails behind the ridge.',
  confidence: 0.95,
  frameRef: 'f2.png',
  model: 'fixture',
  status: 'ai-draft'
};

function setup(descriptions: Description[], tts: FakeTts) {
  return renderHook(
    ({ t }: { t: number }) =>
      useScheduler({
        descriptions,
        subtitles,
        currentTimeSec: t,
        isPlaying: true,
        adEnabled: true,
        tts
      }),
    { initialProps: { t: 0 } }
  );
}

describe('roomBeforeNextCue', () => {
  test('measures the dialogue-free room ahead of a moment', () => {
    expect(roomBeforeNextCue(2.0, subtitles)).toBeCloseTo(8.0, 5);
    expect(roomBeforeNextCue(15.0, subtitles)).toBeCloseTo(5.0, 5);
  });

  test('falls back to the remaining runtime after the last cue', () => {
    expect(roomBeforeNextCue(30.0, subtitles, 60)).toBeCloseTo(30.0, 5);
  });
});

describe('useScheduler runtime invariants', () => {
  test('speaks a description that fits, and only once', () => {
    const tts = new FakeTts();
    const { rerender } = setup([shortDesc], tts);

    act(() => rerender({ t: 2.1 }));
    expect(tts.spoken).toEqual([shortDesc.text]);

    // Re-entering the same slot must not re-trigger the utterance.
    act(() => rerender({ t: 3.0 }));
    act(() => rerender({ t: 4.0 }));
    expect(tts.spoken).toHaveLength(1);
  });

  test('starts synthesis LEAD_IN_SEC early so the voice lands on the slot', () => {
    const tts = new FakeTts();
    const { rerender } = setup([shortDesc], tts);

    act(() => rerender({ t: shortDesc.tStart - LEAD_IN_SEC + 0.05 }));
    expect(tts.spoken).toHaveLength(1);
  });

  test('the caption appears only when the voice is actually audible', () => {
    const tts = new FakeTts();
    const { result, rerender } = setup([shortDesc], tts);

    act(() => rerender({ t: 2.1 }));
    // Dispatched to the engine, but nothing is audible yet.
    expect(result.current.isNarrating).toBe(false);
    expect(result.current.currentDescription).toBeNull();

    act(() => tts.becomeAudible());
    expect(result.current.isNarrating).toBe(true);
    expect(result.current.currentDescription?.id).toBe(shortDesc.id);

    act(() => tts.finish());
    expect(result.current.isNarrating).toBe(false);
    expect(result.current.currentDescription).toBeNull();
  });

  test('REFUSES a description that cannot finish before the next dialogue cue', () => {
    const tts = new FakeTts();
    const { result, rerender } = setup([longDesc], tts);

    const needed = estimateSpeechSec(longDesc.text);
    const room = roomBeforeNextCue(8.5, subtitles);
    expect(needed + TAIL_GUARD_SEC).toBeGreaterThan(room); // premise of the test

    act(() => rerender({ t: 8.6 }));

    expect(tts.spoken).toHaveLength(0);
    expect(result.current.refusal?.reason).toBe('no-gap');
    expect(result.current.refusal?.description.id).toBe(longDesc.id);
  });

  test('HARD INVARIANT: narration is cut the moment dialogue starts', () => {
    const tts = new FakeTts();
    // Passes the fit check at 6.0s (4.0s of room, ~3.2s of speech), but the
    // slot is declared long enough to run past the cue at 10.0s. If the film
    // reaches dialogue while this is still audible it MUST be cut.
    const straddling: Description = { ...shortDesc, id: 'straddle', tStart: 6.0, tEnd: 15.0 };
    const { result, rerender } = setup([straddling], tts);

    act(() => rerender({ t: 6.1 }));
    expect(tts.spoken).toHaveLength(1);
    act(() => tts.becomeAudible());
    expect(result.current.isNarrating).toBe(true);

    act(() => rerender({ t: 10.5 })); // inside dialogue cue 1
    expect(result.current.isNarrating).toBe(false);
    expect(result.current.refusal?.reason).toBe('dialogue-active');
    expect(tts.stops).toBeGreaterThan(0);
  });

  test('dialogue subtitle is exposed while a cue is active', () => {
    const tts = new FakeTts();
    const { result, rerender } = setup([shortDesc], tts);

    act(() => rerender({ t: 11.0 }));
    expect(result.current.currentSubtitle?.id).toBe(1);

    act(() => rerender({ t: 14.0 }));
    expect(result.current.currentSubtitle).toBeNull();
  });

  test('pausing silences narration', () => {
    const tts = new FakeTts();
    const { result, rerender } = renderHook(
      ({ t, playing }: { t: number; playing: boolean }) =>
        useScheduler({
          descriptions: [shortDesc],
          subtitles,
          currentTimeSec: t,
          isPlaying: playing,
          adEnabled: true,
          tts
        }),
      { initialProps: { t: 0, playing: true } }
    );

    act(() => rerender({ t: 2.1, playing: true }));
    act(() => tts.becomeAudible());
    expect(result.current.isNarrating).toBe(true);

    act(() => rerender({ t: 2.4, playing: false }));
    expect(result.current.isNarrating).toBe(false);
    expect(tts.stops).toBeGreaterThan(0);
  });

  test('AD off never speaks', () => {
    const tts = new FakeTts();
    const { rerender } = renderHook(
      ({ t }: { t: number }) =>
        useScheduler({
          descriptions: [shortDesc],
          subtitles,
          currentTimeSec: t,
          isPlaying: true,
          adEnabled: false,
          tts
        }),
      { initialProps: { t: 0 } }
    );

    act(() => rerender({ t: 2.1 }));
    act(() => rerender({ t: 4.0 }));
    expect(tts.spoken).toHaveLength(0);
  });
});
