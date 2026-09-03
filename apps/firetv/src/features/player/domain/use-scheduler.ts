import { useState, useEffect, useRef, useCallback } from 'react';
import { Description, SubtitleCue } from '@narratv/contracts';
import { ITtsAdapter, ttsAdapter, estimateSpeechSec } from '../data/tts-adapter';

/**
 * Runtime narration invariants
 * ----------------------------
 * The offline scheduler (packages/scheduler) already fits every description
 * into a dialogue-free gap with a 300 ms guard band. This hook enforces the
 * same contract at PLAYBACK time, where two things the offline pass cannot
 * know come into play:
 *
 *   1. Device TTS synthesis latency. `Speech.speak` returns immediately but
 *      the voice is not audible for ~0.3-1.5 s. Firing at `tStart` therefore
 *      pushes the tail of the utterance towards the next dialogue cue, and
 *      draws the caption before anything is audible.
 *   2. Late entry. If the viewer seeks or unpauses part-way through a gap,
 *      the remaining room is smaller than the gap the offline pass measured.
 *
 * So: speak EARLY by LEAD_IN_SEC to absorb synthesis latency, and refuse
 * outright unless the utterance still fits before the next cue with
 * TAIL_GUARD_SEC to spare. A refusal is surfaced, never silently swallowed.
 */

/**
 * Fallback lead-in, used only until the adapter has measured a real one.
 * The live value comes from `tts.getLeadInSec()`: the adapter times every
 * utterance from dispatch to first audible sample and feeds back a rolling
 * average. A hard-coded constant cannot track the difference between an
 * embedded voice and a network voice, or a cold engine and a warm one, which
 * is what leaves a residual lag.
 */
export const LEAD_IN_SEC = 0.6;
/** Required silence between the end of narration and the next dialogue cue. */
export const TAIL_GUARD_SEC = 0.4;

export type RefusalReason = 'no-gap' | 'dialogue-active';

export interface UseSchedulerProps {
  descriptions: Description[];
  subtitles: SubtitleCue[];
  currentTimeSec: number;
  isPlaying: boolean;
  adEnabled: boolean;
  tts?: ITtsAdapter;
}

export interface UseSchedulerReturn {
  /** The description whose narration is AUDIBLE right now (null when silent). */
  currentDescription: Description | null;
  currentSubtitle: SubtitleCue | null;
  isNarrating: boolean;
  /** Set when a description was refused because it would have collided. */
  refusal: { description: Description; reason: RefusalReason } | null;
  activeDescriptionCount: number;
  resetSpokenHistory: () => void;
}

/** Seconds of dialogue-free room from `t` until the next cue begins. */
export function roomBeforeNextCue(
  t: number,
  subtitles: SubtitleCue[],
  durationSec: number = Number.POSITIVE_INFINITY
): number {
  let next = durationSec;
  for (const cue of subtitles) {
    if (cue.tStart >= t && cue.tStart < next) next = cue.tStart;
  }
  return next - t;
}

export function useScheduler({
  descriptions,
  subtitles,
  currentTimeSec,
  isPlaying,
  adEnabled,
  tts = ttsAdapter
}: UseSchedulerProps): UseSchedulerReturn {
  const [currentDescription, setCurrentDescription] = useState<Description | null>(null);
  const [currentSubtitle, setCurrentSubtitle] = useState<SubtitleCue | null>(null);
  const [isNarrating, setIsNarrating] = useState<boolean>(false);
  const [refusal, setRefusal] = useState<{ description: Description; reason: RefusalReason } | null>(null);

  /** Descriptions already handled (spoken or refused) for this pass. */
  const handledIdsRef = useRef<Set<string>>(new Set());
  const lastTimeRef = useRef<number>(currentTimeSec);
  /** The utterance currently dispatched to the TTS engine, audible or not. */
  const pendingRef = useRef<Description | null>(null);
  /** Latest video clock, readable from async TTS callbacks. */
  const nowRef = useRef<number>(currentTimeSec);
  nowRef.current = currentTimeSec;

  const silence = useCallback(() => {
    pendingRef.current = null;
    setIsNarrating(false);
    setCurrentDescription(null);
    tts.stop();
  }, [tts]);

  const resetSpokenHistory = useCallback(() => {
    handledIdsRef.current.clear();
    setRefusal(null);
    silence();
  }, [silence]);

  // Resolve the voice and seed the lead-in before the first description is
  // due, so the opening narration is already close rather than calibrating on
  // the viewer. Voice enumeration is slow enough to matter here.
  useEffect(() => {
    tts.prime?.();
  }, [tts]);

  // Seeking backwards re-arms everything after the new position.
  useEffect(() => {
    if (currentTimeSec < lastTimeRef.current - 2.0) {
      const kept = new Set<string>();
      for (const desc of descriptions) {
        if (desc.tStart < currentTimeSec && handledIdsRef.current.has(desc.id)) {
          kept.add(desc.id);
        }
      }
      handledIdsRef.current = kept;
      setRefusal(null);
      silence();
    }
    lastTimeRef.current = currentTimeSec;
  }, [currentTimeSec, descriptions, silence]);

  // Main loop. Driven purely by currentTimeSec from react-native-video
  // onProgress — never by a wall-clock timer.
  useEffect(() => {
    if (!isPlaying) {
      if (pendingRef.current) silence();
      return;
    }

    // 1. Dialogue takes absolute priority.
    const activeCue = subtitles.find(
      cue => currentTimeSec >= cue.tStart && currentTimeSec <= cue.tEnd
    );
    setCurrentSubtitle(activeCue || null);

    if (activeCue) {
      // HARD INVARIANT: narration must never be audible over dialogue.
      if (pendingRef.current) {
        setRefusal({ description: pendingRef.current, reason: 'dialogue-active' });
        silence();
      }
      return;
    }

    if (!adEnabled) {
      if (pendingRef.current) silence();
      return;
    }

    // 2. An utterance already in flight keeps the floor until its slot ends.
    const pending = pendingRef.current;
    if (pending) {
      if (currentTimeSec >= pending.tEnd + TAIL_GUARD_SEC) {
        silence();
      }
      return;
    }

    // 3. Look for a description whose slot we are entering. The LEAD_IN
    //    window lets synthesis begin before the slot so the voice lands on time.
    const leadIn = tts.getLeadInSec ? tts.getLeadInSec() : LEAD_IN_SEC;

    const candidate = descriptions.find(
      desc =>
        desc.status !== 'skipped' &&
        !handledIdsRef.current.has(desc.id) &&
        currentTimeSec >= desc.tStart - leadIn &&
        currentTimeSec < desc.tEnd
    );

    if (!candidate) return;

    handledIdsRef.current.add(candidate.id);

    // 4. Will it actually fit before the next line of dialogue?
    const needed = candidate.durationSec ?? estimateSpeechSec(candidate.text);
    // Measured from when the voice will actually be AUDIBLE (one lead-in from
    // now), not from this instant - otherwise the room is over-counted by the
    // lead-in and a tight gap slips through.
    const room = roomBeforeNextCue(currentTimeSec + leadIn, subtitles);

    if (needed + TAIL_GUARD_SEC > room) {
      // Refuse loudly rather than talk over the film.
      setRefusal({ description: candidate, reason: 'no-gap' });
      return;
    }

    // 5. Speak. The caption is raised by onStart, so text and voice appear
    //    together no matter how long synthesis takes.
    pendingRef.current = candidate;
    setRefusal(null);
    // Sync telemetry, against the VIDEO clock rather than wall time. `error` is
    // the number that matters: how far the voice actually landed from the
    // moment it was written for. Anything under ~0.2s reads as in sync.
    console.log(
      `[narratv] AD ${candidate.id} dispatch@${currentTimeSec.toFixed(2)}s target=${candidate.tStart.toFixed(2)}s leadIn=${leadIn.toFixed(2)}s`
    );
    tts
      .speak(candidate.text, candidate.audioUrl, {
        onStart: () => {
          if (pendingRef.current?.id !== candidate.id) return;
          const audibleAt = nowRef.current;
          console.log(
            `[narratv] AD ${candidate.id} audible@${audibleAt.toFixed(2)}s target=${candidate.tStart.toFixed(2)}s error=${(audibleAt - candidate.tStart).toFixed(2)}s`
          );
          setCurrentDescription(candidate);
          setIsNarrating(true);
        },
        onDone: () => {
          if (pendingRef.current?.id !== candidate.id) return;
          pendingRef.current = null;
          setIsNarrating(false);
          setCurrentDescription(null);
        },
        onError: () => {
          if (pendingRef.current?.id !== candidate.id) return;
          pendingRef.current = null;
          setIsNarrating(false);
          setCurrentDescription(null);
        }
      })
      .catch(() => {
        if (pendingRef.current?.id === candidate.id) {
          pendingRef.current = null;
          setIsNarrating(false);
          setCurrentDescription(null);
        }
      });
  }, [currentTimeSec, isPlaying, adEnabled, descriptions, subtitles, tts, silence]);

  const activeDescriptionCount = descriptions.filter(d => d.status !== 'skipped').length;

  return {
    currentDescription,
    currentSubtitle,
    isNarrating,
    refusal,
    activeDescriptionCount,
    resetSpokenHistory
  };
}
