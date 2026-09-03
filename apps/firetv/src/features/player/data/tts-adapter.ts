import * as Speech from 'expo-speech';
import { Audio } from 'expo-av';
import { getNarrationVoice, NARRATION_RATE, NARRATION_PITCH } from './voice-selection';

/**
 * Callbacks let the scheduler drive UI from the REAL speech lifecycle rather
 * than from the scheduled slot boundary. Device TTS has a variable synthesis
 * latency (~0.3-1.5s on Fire TV / emulator images), so a caption drawn at
 * `tStart` appears before the voice is audible and reads as out of sync.
 */
export interface SpeakCallbacks {
  onStart?: () => void;
  onDone?: () => void;
  onError?: () => void;
}

export interface ITtsAdapter {
  speak(text: string, audioUrl?: string, callbacks?: SpeakCallbacks): Promise<void>;
  stop(): Promise<void>;
  isSpeaking(): Promise<boolean>;
  /**
   * How far ahead of the intended moment the scheduler should dispatch speech,
   * in seconds. Optional so test doubles need not implement it.
   */
  getLeadInSec?(): number;
}

/** Starting guess before any utterance has been measured. */
export const DEFAULT_LEAD_IN_SEC = 0.6;
const MIN_LEAD_IN_SEC = 0.25;
const MAX_LEAD_IN_SEC = 2.0;
/** Weight of the newest measurement in the rolling average. */
const LATENCY_SMOOTHING = 0.4;

/** Words per second the device voice actually sustains at rate 1.0. */
export const SPEECH_WORDS_PER_SEC = 2.5;

/**
 * Conservative estimate of how long `text` will take to speak aloud.
 * Deliberately rounds UP: over-estimating makes the scheduler refuse a tight
 * gap, which is safe. Under-estimating would let narration run into dialogue.
 */
export function estimateSpeechSec(text: string, wordsPerSec = SPEECH_WORDS_PER_SEC): number {
  if (!text || !text.trim()) return 0;
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  // Divided by the narration rate: reading slightly slower for clarity makes
  // every utterance proportionally longer, and the gap-fit check must know.
  return Math.max(1.0, words / (wordsPerSec * NARRATION_RATE) + 0.35);
}

export class TtsAdapter implements ITtsAdapter {
  private currentSound: Audio.Sound | null = null;
  private isSpeakingLocally = false;
  /** Incremented on every speak/stop so late callbacks from a cancelled
   *  utterance cannot resurrect narration state for a newer one. */
  private generation = 0;

  /**
   * Measured synthesis latency: the gap between asking the engine to speak and
   * the first audible sample. A fixed guess cannot be right - it varies with
   * the voice (embedded vs network), the device, and whether the engine is
   * warm. So we measure every utterance and feed the rolling average back to
   * the scheduler as its lead-in. That is what removes the residual lag,
   * rather than nudging a constant until it looks about right.
   */
  private leadInSec = DEFAULT_LEAD_IN_SEC;

  getLeadInSec(): number {
    return this.leadInSec;
  }

  private recordLatency(dispatchedAtMs: number) {
    const observed = (Date.now() - dispatchedAtMs) / 1000;
    // Ignore absurd samples (app backgrounded, engine wedged).
    if (observed < 0 || observed > 5) return;
    const blended = this.leadInSec * (1 - LATENCY_SMOOTHING) + observed * LATENCY_SMOOTHING;
    this.leadInSec = Math.min(MAX_LEAD_IN_SEC, Math.max(MIN_LEAD_IN_SEC, blended));
  }

  async speak(text: string, audioUrl?: string, callbacks: SpeakCallbacks = {}): Promise<void> {
    await this.stop();

    const gen = ++this.generation;
    const fresh = () => gen === this.generation;
    const dispatchedAtMs = Date.now();

    if (audioUrl) {
      try {
        const { sound } = await Audio.Sound.createAsync(
          { uri: audioUrl },
          { shouldPlay: true, volume: 1.0 }
        );
        if (!fresh()) {
          await sound.unloadAsync();
          return;
        }
        this.currentSound = sound;
        this.isSpeakingLocally = true;

        let started = false;
        sound.setOnPlaybackStatusUpdate(status => {
          if (!status.isLoaded || !fresh()) return;
          if (status.isPlaying && !started) {
            started = true;
            this.recordLatency(dispatchedAtMs);
            callbacks.onStart?.();
          }
          if (status.didJustFinish) {
            this.isSpeakingLocally = false;
            sound.unloadAsync();
            this.currentSound = null;
            callbacks.onDone?.();
          }
        });
        return;
      } catch (err) {
        console.warn('MP3 playback failed, falling back to device TTS:', err);
      }
    }

    if (text && text.trim()) {
      this.isSpeakingLocally = true;
      // Best available device voice, resolved once. Falls back to the engine
      // default rather than failing to speak.
      const voice = await getNarrationVoice();
      if (!fresh()) return;
      Speech.speak(text, {
        language: voice?.language || 'en-US',
        ...(voice?.identifier ? { voice: voice.identifier } : {}),
        rate: NARRATION_RATE,
        pitch: NARRATION_PITCH,
        onStart: () => {
          if (!fresh()) return;
          this.recordLatency(dispatchedAtMs);
          callbacks.onStart?.();
        },
        onDone: () => {
          if (!fresh()) return;
          this.isSpeakingLocally = false;
          callbacks.onDone?.();
        },
        onStopped: () => {
          if (!fresh()) return;
          this.isSpeakingLocally = false;
          callbacks.onDone?.();
        },
        onError: () => {
          if (!fresh()) return;
          this.isSpeakingLocally = false;
          callbacks.onError?.();
        }
      });
    } else {
      callbacks.onDone?.();
    }
  }

  async stop(): Promise<void> {
    this.generation++;
    this.isSpeakingLocally = false;

    if (this.currentSound) {
      const sound = this.currentSound;
      this.currentSound = null;
      try {
        await sound.stopAsync();
        await sound.unloadAsync();
      } catch {
        // ignore
      }
    }

    try {
      const isSpeaking = await Speech.isSpeakingAsync();
      if (isSpeaking) {
        await Speech.stop();
      }
    } catch {
      // ignore
    }
  }

  async isSpeaking(): Promise<boolean> {
    if (this.isSpeakingLocally) return true;
    try {
      return await Speech.isSpeakingAsync();
    } catch {
      return false;
    }
  }
}

export const ttsAdapter = new TtsAdapter();
