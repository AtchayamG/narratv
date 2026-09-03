import * as Speech from 'expo-speech';
import { Audio } from 'expo-av';

export interface ITtsAdapter {
  speak(text: string, audioUrl?: string): Promise<void>;
  stop(): Promise<void>;
  isSpeaking(): Promise<boolean>;
}

export class TtsAdapter implements ITtsAdapter {
  private currentSound: Audio.Sound | null = null;
  private isSpeakingLocally = false;

  async speak(text: string, audioUrl?: string): Promise<void> {
    await this.stop();

    if (audioUrl) {
      try {
        const { sound } = await Audio.Sound.createAsync(
          { uri: audioUrl },
          { shouldPlay: true, volume: 1.0 }
        );
        this.currentSound = sound;
        this.isSpeakingLocally = true;

        sound.setOnPlaybackStatusUpdate(status => {
          if (status.isLoaded && status.didJustFinish) {
            this.isSpeakingLocally = false;
            sound.unloadAsync();
            this.currentSound = null;
          }
        });
        return;
      } catch (err) {
        console.warn('MP3 playback failed, falling back to device TTS:', err);
      }
    }

    // Fallback or default device TTS (expo-speech)
    if (text && text.trim()) {
      this.isSpeakingLocally = true;
      Speech.speak(text, {
        language: 'en',
        rate: 1.05,
        pitch: 1.0,
        onDone: () => {
          this.isSpeakingLocally = false;
        },
        onError: () => {
          this.isSpeakingLocally = false;
        }
      });
    }
  }

  async stop(): Promise<void> {
    this.isSpeakingLocally = false;

    if (this.currentSound) {
      try {
        await this.currentSound.stopAsync();
        await this.currentSound.unloadAsync();
      } catch {
        // ignore
      }
      this.currentSound = null;
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
