import * as Speech from 'expo-speech';
import { AccessibilityRole } from 'react-native';

export interface AccessibilityProps {
  accessible: boolean;
  accessibilityRole: AccessibilityRole;
  accessibilityLabel: string;
  accessibilityHint?: string;
}

export function createA11yProps(
  label: string,
  hint?: string,
  role: AccessibilityRole = 'button'
): AccessibilityProps {
  return {
    accessible: true,
    accessibilityRole: role,
    accessibilityLabel: label,
    accessibilityHint: hint
  };
}

export async function announceForAccessibility(message: string): Promise<void> {
  try {
    const isSpeaking = await Speech.isSpeakingAsync();
    if (isSpeaking) {
      await Speech.stop();
    }
    Speech.speak(message, {
      language: 'en',
      rate: 1.0,
      pitch: 1.0
    });
  } catch {
    // Non-fatal if speech unavailable in test environment
  }
}
