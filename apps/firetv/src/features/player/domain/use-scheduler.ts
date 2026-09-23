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

/**
 * How long a refusal notice stays on the picture, measured in film time from
 * the moment it was RAISED - not from the end of the line it refused.
 *
 * Anchoring it to the refused line's tEnd was the obvious first guess and it is
 * wrong twice over: a five-second line would leave the notice up for eight
 * seconds, and a 'dialogue-active' refusal is raised well after its line's
 * tStart, so an anchor at either end of the line gives a hold that has nothing
 * to do with when the viewer actually saw it appear.
 */
export const REFUSAL_HOLD_SEC = 4.0;

/**
 * How late an unseen extended-pause window may still be refused out loud.
 * Long enough to outlast a line of dialogue that swallowed the window; past
 * this, the viewer has seeked beyond it and no notice is owed.
 */
export const MISSED_WINDOW_MAX_SEC = 8.0;

export type RefusalReason = 'no-gap' | 'dialogue-active';

export interface UseSchedulerProps {
  descriptions: Description[];
  subtitles: SubtitleCue[];
  currentTimeSec: number;
  isPlaying: boolean;
  adEnabled: boolean;
  extendedEnabled?: boolean;
  onPausePlayback?: () => void;
  onResumePlayback?: () => void;
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
  /** True while video is paused to speak an extended description (WCAG 2.2 SC 1.2.7). */
  isExtendedPaused: boolean;
  /** The description currently being delivered during extended pause. */
  extendedPauseDescription: Description | null;
  /** Viewer interrupt: cancels extended pause, stops speech, resumes playback. */
  interruptExtendedPause: () => void;
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
  extendedEnabled = false,
  onPausePlayback,
  onResumePlayback,
  tts = ttsAdapter
}: UseSchedulerProps): UseSchedulerReturn {
  const [currentDescription, setCurrentDescription] = useState<Description | null>(null);
  const [currentSubtitle, setCurrentSubtitle] = useState<SubtitleCue | null>(null);
  const [isNarrating, setIsNarrating] = useState<boolean>(false);
  const [refusal, setRefusal] = useState<{ description: Description; reason: RefusalReason } | null>(null);
  const [isExtendedPaused, setIsExtendedPaused] = useState<boolean>(false);
  const [extendedPauseDescription, setExtendedPauseDescription] = useState<Description | null>(null);

  /** Film time at which the current refusal notice went up. */
  const refusalSetAtRef = useRef<number | null>(null);

  /** Descriptions already handled (spoken or refused) for this pass. */
  const handledIdsRef = useRef<Set<string>>(new Set());
  const lastTimeRef = useRef<number>(currentTimeSec);
  /** The utterance currently dispatched to the TTS engine, audible or not. */
  const pendingRef = useRef<Description | null>(null);
  /** Latest video clock, readable from async TTS callbacks. */
  const nowRef = useRef<number>(currentTimeSec);
  nowRef.current = currentTimeSec;

  const isExtendedPausedRef = useRef<boolean>(false);
  const extendedTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const silence = useCallback(() => {
    pendingRef.current = null;
    setIsNarrating(false);
    setCurrentDescription(null);
    tts.stop();
  }, [tts]);

  const clearExtendedPause = useCallback(
    (resumePlayback = true) => {
      if (extendedTimeoutRef.current) {
        clearTimeout(extendedTimeoutRef.current);
        extendedTimeoutRef.current = null;
      }
      if (isExtendedPausedRef.current) {
        isExtendedPausedRef.current = false;
        setIsExtendedPaused(false);
        setExtendedPauseDescription(null);
        if (resumePlayback) {
          console.log('[narratv] video resumed');
          onResumePlayback?.();
        }
      }
    },
    [onResumePlayback]
  );

  const interruptExtendedPause = useCallback(() => {
    if (isExtendedPausedRef.current) {
      silence();
      clearExtendedPause(true);
    }
  }, [silence, clearExtendedPause]);

  const resetSpokenHistory = useCallback(() => {
    handledIdsRef.current.clear();
    refusalSetAtRef.current = null;
    setRefusal(null);
    silence();
    clearExtendedPause(false);
  }, [silence, clearExtendedPause]);

  // Resolve the voice and seed the lead-in before the first description is
  // due, so the opening narration is already close rather than calibrating on
  // the viewer. Voice enumeration is slow enough to matter here.
  useEffect(() => {
    tts.prime?.();
    return () => {
      if (extendedTimeoutRef.current) {
        clearTimeout(extendedTimeoutRef.current);
        extendedTimeoutRef.current = null;
      }
    };
  }, [tts]);

  // Seeking backwards or forwards re-arms everything after the new position and cancels extended pause.
  useEffect(() => {
    if (Math.abs(currentTimeSec - lastTimeRef.current) > 2.0) {
      if (isExtendedPausedRef.current) {
        clearExtendedPause(false);
        silence();
      }
      if (currentTimeSec < lastTimeRef.current - 2.0) {
        const kept = new Set<string>();
        for (const desc of descriptions) {
          if (desc.tStart < currentTimeSec && handledIdsRef.current.has(desc.id)) {
            kept.add(desc.id);
          }
        }
        handledIdsRef.current = kept;
        refusalSetAtRef.current = null;
        setRefusal(null);
        silence();
      }
    }
    lastTimeRef.current = currentTimeSec;
  }, [currentTimeSec, descriptions, silence, clearExtendedPause]);

  // Main loop. Driven purely by currentTimeSec from react-native-video
  // onProgress — never by a wall-clock timer.
  useEffect(() => {
    if (!isPlaying && !isExtendedPausedRef.current) {
      if (pendingRef.current) silence();
      return;
    }

    // A refusal notice is information with a shelf life. Hold it long enough to
    // read at ten feet, then take it down - otherwise it sits on the picture
    // until the next description happens to speak, which for the refusal at
    // 2:26.8 is eleven seconds later and reads as a stuck overlay rather than a
    // decision about one line.
    if (
      refusal &&
      refusalSetAtRef.current !== null &&
      currentTimeSec > refusalSetAtRef.current + REFUSAL_HOLD_SEC
    ) {
      refusalSetAtRef.current = null;
      setRefusal(null);
    }

    // 1. Dialogue takes absolute priority.
    const activeCue = subtitles.find(
      cue => currentTimeSec >= cue.tStart && currentTimeSec <= cue.tEnd
    );
    setCurrentSubtitle(activeCue || null);

    if (activeCue) {
      // HARD INVARIANT: narration must never be audible over dialogue.
      if (pendingRef.current) {
        refusalSetAtRef.current = currentTimeSec;
        setRefusal({ description: pendingRef.current, reason: 'dialogue-active' });
        silence();
        clearExtendedPause(true);
      }
      return;
    }

    if (!adEnabled) {
      if (pendingRef.current) silence();
      clearExtendedPause(true);
      return;
    }

    // 2. An extended pause in flight keeps the video paused until speech completes.
    if (isExtendedPausedRef.current) {
      return;
    }

    // An utterance already in flight keeps the floor until its slot ends.
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

    // 2b. A description the LOADER already refused still owes the viewer an
    //     explanation, and it owes it in context, at the moment the line would
    //     have been spoken.
    const preRefused = descriptions.find(
      desc =>
        desc.status === 'skipped' &&
        !handledIdsRef.current.has(desc.id) &&
        currentTimeSec >= desc.tStart &&
        currentTimeSec < desc.tEnd
    );

    if (preRefused) {
      handledIdsRef.current.add(preRefused.id);
      refusalSetAtRef.current = currentTimeSec;
      setRefusal({
        description: preRefused,
        reason: (preRefused.skipReason as RefusalReason) || 'no-gap'
      });
      return;
    }

    const triggerExtendedPause = (desc: Description) => {
      console.log(`[narratv] extended pause triggered at ${currentTimeSec.toFixed(2)}s for ${desc.id}`);
      handledIdsRef.current.add(desc.id);
      isExtendedPausedRef.current = true;
      setIsExtendedPaused(true);
      setExtendedPauseDescription(desc);
      console.log('[narratv] video paused');
      onPausePlayback?.();

      refusalSetAtRef.current = null;
      setRefusal(null);
      pendingRef.current = desc;

      const duration = desc.durationSec ?? estimateSpeechSec(desc.text);
      const watchdogMs = Math.round((duration + 3.0) * 1000);

      if (extendedTimeoutRef.current) {
        clearTimeout(extendedTimeoutRef.current);
      }

      extendedTimeoutRef.current = setTimeout(() => {
        console.warn(`[narratv] Extended AD ${desc.id} timed out after ${watchdogMs}ms watchdog`);
        setRefusal({ description: desc, reason: 'no-gap' });
        silence();
        clearExtendedPause(true);
      }, watchdogMs);

      tts
        .speak(desc.text, desc.audioUrl, {
          onStart: () => {
            if (pendingRef.current?.id !== desc.id) return;
            setCurrentDescription(desc);
            setIsNarrating(true);
          },
          onDone: () => {
            if (pendingRef.current?.id !== desc.id) return;
            console.log('[narratv] TTS finished');
            silence();
            clearExtendedPause(true);
          },
          onError: (err?: any) => {
            if (pendingRef.current?.id !== desc.id) return;
            console.error(`[narratv] Extended AD ${desc.id} TTS error:`, err);
            setRefusal({ description: desc, reason: 'no-gap' });
            silence();
            clearExtendedPause(true);
          }
        })
        .catch((err) => {
          if (pendingRef.current?.id === desc.id) {
            console.error(`[narratv] Extended AD ${desc.id} TTS catch error:`, err);
            setRefusal({ description: desc, reason: 'no-gap' });
            silence();
            clearExtendedPause(true);
          }
        });
    };

    // If extended mode is on, look for an extended description at its safe pausePoint
    if (extendedEnabled) {
      // A pause window can pass unseen: step 1 returns early on every tick that
      // falls inside dialogue, so a clock sample that lands in a line during the
      // window means the line is neither spoken nor refused - it just vanishes.
      // Silence is what a refusal must never look like, so a missed window is
      // refused out loud on the first tick after the dialogue releases the floor.
      // Anything more than MISSED_WINDOW_MAX_SEC late is treated as a seek past
      // it, which is the viewer's choice and owes no notice.
      const missed = descriptions.find(desc => {
        if (desc.status === 'skipped' || !desc.isExtended || handledIdsRef.current.has(desc.id)) return false;
        const windowEnd = (desc.pausePoint ?? desc.tStart) + 0.8;
        return currentTimeSec > windowEnd && currentTimeSec <= windowEnd + MISSED_WINDOW_MAX_SEC;
      });
      if (missed) {
        handledIdsRef.current.add(missed.id);
        refusalSetAtRef.current = currentTimeSec;
        setRefusal({ description: missed, reason: 'dialogue-active' });
        return;
      }

      const extendedCandidate = descriptions.find(
        desc =>
          desc.status !== 'skipped' &&
          desc.isExtended &&
          !handledIdsRef.current.has(desc.id) &&
          currentTimeSec >= (desc.pausePoint ?? desc.tStart) - 0.15 &&
          currentTimeSec <= (desc.pausePoint ?? desc.tStart) + 0.8
      );

      if (extendedCandidate) {
        triggerExtendedPause(extendedCandidate);
        return;
      }
    }

    const candidate = descriptions.find(
      desc =>
        desc.status !== 'skipped' &&
        !desc.isExtended &&
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
      if (extendedEnabled) {
        triggerExtendedPause(candidate);
        return;
      }
      // Refuse loudly rather than talk over the film.
      refusalSetAtRef.current = currentTimeSec;
      setRefusal({ description: candidate, reason: 'no-gap' });
      return;
    }

    // 5. Speak. The caption is raised by onStart, so text and voice appear
    //    together no matter how long synthesis takes.
    pendingRef.current = candidate;
    refusalSetAtRef.current = null;
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
  }, [
    currentTimeSec,
    isPlaying,
    adEnabled,
    extendedEnabled,
    descriptions,
    subtitles,
    tts,
    silence,
    refusal,
    clearExtendedPause,
    onPausePlayback
  ]);

  const activeDescriptionCount = descriptions.filter(d => d.status !== 'skipped').length;

  return {
    currentDescription,
    currentSubtitle,
    isNarrating,
    refusal,
    activeDescriptionCount,
    resetSpokenHistory,
    isExtendedPaused,
    extendedPauseDescription,
    interruptExtendedPause
  };
}
