import React, { useEffect, useRef } from 'react';
import { Text, StyleSheet, Animated } from 'react-native';
import { colors, typography, spacing, radii } from '../core/theme';
import { announceForAccessibility } from '../core/accessibility';

export interface ToastProps {
  message: string;
  visible: boolean;
  durationMs?: number;
  onDismiss?: () => void;
  type?: 'info' | 'success' | 'warning' | 'error';
}

export const Toast: React.FC<ToastProps> = ({
  message,
  visible,
  durationMs = 4000,
  onDismiss,
  type = 'info'
}) => {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible && message) {
      announceForAccessibility(message);
      Animated.timing(opacity, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true
      }).start();

      const timer = setTimeout(() => {
        Animated.timing(opacity, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true
        }).start(() => {
          onDismiss?.();
        });
      }, durationMs);

      return () => clearTimeout(timer);
    } else {
      opacity.setValue(0);
      return undefined;
    }
  }, [visible, message, durationMs, onDismiss, opacity]);

  if (!visible || !message) return null;

  const getBorderColor = () => {
    switch (type) {
      case 'success': return colors.verified;
      case 'warning': return colors.primary;
      case 'error': return colors.error;
      default: return colors.narration;
    }
  };

  return (
    <Animated.View
      style={[
        styles.container,
        { opacity, borderLeftColor: getBorderColor() }
      ]}
      accessibilityLiveRegion="polite"
      accessibilityRole="alert"
    >
      <Text style={styles.text}>{message}</Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 40,
    alignSelf: 'center',
    backgroundColor: 'rgba(24, 24, 27, 0.95)',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderLeftWidth: 5,
    maxWidth: '80%',
    zIndex: 9999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 10
  },
  text: {
    ...typography.bodyMedium,
    color: colors.textPrimary,
    fontWeight: '600',
    textAlign: 'center'
  }
});
