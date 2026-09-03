import { useState, useEffect, useRef, useCallback } from 'react';
import { Description, SubtitleCue } from '@narratv/contracts';
import { ITtsAdapter, ttsAdapter } from '../data/tts-adapter';

export interface UseSchedulerProps {
  descriptions: Description[];
  subtitles: SubtitleCue[];
  currentTimeSec: number;
  isPlaying: boolean;
  adEnabled: boolean;
  tts?: ITtsAdapter;
}

export interface UseSchedulerReturn {
  currentDescription: Description | null;
  currentSubtitle: SubtitleCue | null;
  isNarrating: boolean;
  activeDescriptionCount: number;
  resetSpokenHistory: () => void;
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

  const spokenIdsRef = useRef<Set<string>>(new Set());
  const lastTimeRef = useRef<number>(currentTimeSec);

  const resetSpokenHistory = useCallback(() => {
    spokenIdsRef.current.clear();
    setCurrentDescription(null);
    setIsNarrating(false);
    tts.stop();
  }, [tts]);

  // Detect seeks backward and invalidate recently spoken descriptions
  useEffect(() => {
    if (currentTimeSec < lastTimeRef.current - 2.0) {
      // Seeked backwards: remove items that started after current time
      const nextSpoken = new Set<string>();
      for (const desc of descriptions) {
        if (desc.tStart < currentTimeSec && spokenIdsRef.current.has(desc.id)) {
          nextSpoken.add(desc.id);
        }
      }
      spokenIdsRef.current = nextSpoken;
    }
    lastTimeRef.current = currentTimeSec;
  }, [currentTimeSec, descriptions]);

  // Main synchronization loop
  useEffect(() => {
    if (!isPlaying) {
      if (isNarrating) {
        setIsNarrating(false);
        tts.stop();
      }
      return;
    }

    // 1. Check for active dialogue / subtitle cue
    const activeCue = subtitles.find(
      cue => currentTimeSec >= cue.tStart && currentTimeSec <= cue.tEnd
    );
    setCurrentSubtitle(activeCue || null);

    // Hard refusal invariant: if dialogue is active, narration MUST NOT speak
    if (activeCue) {
      if (isNarrating) {
        setIsNarrating(false);
        tts.stop();
      }
      return;
    }

    // If AD is disabled, exit early
    if (!adEnabled) {
      if (isNarrating) {
        setIsNarrating(false);
        tts.stop();
      }
      setCurrentDescription(null);
      return;
    }

    // 2. Check for active scheduled description slot
    const activeDesc = descriptions.find(
      desc =>
        desc.status !== 'skipped' &&
        currentTimeSec >= desc.tStart &&
        currentTimeSec < desc.tEnd
    );

    if (activeDesc) {
      setCurrentDescription(activeDesc);

      // Speak description if not already triggered for this slot
      if (!spokenIdsRef.current.has(activeDesc.id)) {
        spokenIdsRef.current.add(activeDesc.id);
        setIsNarrating(true);
        tts.speak(activeDesc.text, activeDesc.audioUrl).catch(() => {
          setIsNarrating(false);
        });
      }
    } else {
      setCurrentDescription(null);
      if (isNarrating) {
        // Slot ended: stop speech if still speaking
        setIsNarrating(false);
        tts.stop();
      }
    }
  }, [currentTimeSec, isPlaying, adEnabled, descriptions, subtitles, isNarrating, tts]);

  const activeDescriptionCount = descriptions.filter(d => d.status !== 'skipped').length;

  return {
    currentDescription,
    currentSubtitle,
    isNarrating,
    activeDescriptionCount,
    resetSpokenHistory
  };
}
