import * as Speech from 'expo-speech';
import { Audio } from 'expo-av';

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
}

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
  return Math.max(1.0, words / wordsPerSec + 0.35);
}

export class TtsAdapter implements ITtsAdapter {
  private currentSound: Audio.Sound | null = null;
  private isSpeakingLocally = false;
  /** Incremented on every speak/stop so late callbacks from a cancelled
   *  utterance cannot resurrect narration state for a newer one. */
  private generation = 0;

  async speak(text: string, audioUrl?: string, callbacks: SpeakCallbacks = {}): Promise<void> {
    await this.stop();

    const gen = ++this.generation;
    const fresh = () => gen === this.generation;

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
      Speech.speak(text, {
        language: 'en',
        rate: 1.0,
        pitch: 1.0,
        onStart: () => {
          if (fresh()) callbacks.onStart?.();
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
