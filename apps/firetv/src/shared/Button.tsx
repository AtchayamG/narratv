import React, { useState } from 'react';
import {
  Pressable,
  Text,
  StyleSheet,
  ViewStyle,
  StyleProp,
  View
} from 'react-native';
import { colors, typography, focusStyles, radii } from '../core/theme';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'live' | 'ghost';

export interface ButtonProps {
  label: string;
  onPress: () => void;
  onFocus?: () => void;
  variant?: ButtonVariant;
  style?: StyleProp<ViewStyle>;
  hasTVPreferredFocus?: boolean;
  disabled?: boolean;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  label,
  onPress,
  onFocus,
  variant = 'primary',
  style,
  hasTVPreferredFocus,
  disabled = false,
  accessibilityLabel,
  accessibilityHint,
  icon
}) => {
  const [isFocused, setIsFocused] = useState(false);

  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return {
          base: { backgroundColor: colors.primary, borderColor: colors.primary },
          text: { color: colors.textInverse, fontWeight: '700' as const }
        };
      case 'secondary':
        return {
          base: { backgroundColor: colors.surfaceElevated, borderColor: colors.border },
          text: { color: colors.textPrimary, fontWeight: '600' as const }
        };
      case 'outline':
        return {
          base: { backgroundColor: 'transparent', borderColor: colors.border },
          text: { color: colors.textPrimary, fontWeight: '600' as const }
        };
      case 'live':
        return {
          base: { backgroundColor: colors.error, borderColor: colors.error },
          text: { color: colors.textPrimary, fontWeight: '700' as const }
        };
      case 'ghost':
        return {
          base: { backgroundColor: 'transparent', borderColor: 'transparent' },
          text: { color: colors.textSecondary, fontWeight: '500' as const }
        };
    }
  };

  const vStyles = getVariantStyles();

  return (
    <Pressable
      onPress={onPress}
      onFocus={() => {
        setIsFocused(true);
        onFocus?.();
      }}
      onBlur={() => setIsFocused(false)}
      hasTVPreferredFocus={hasTVPreferredFocus}
      disabled={disabled}
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled, selected: isFocused }}
      style={[
        styles.base,
        vStyles.base,
        disabled && styles.disabled,
        isFocused && [styles.focused, focusStyles.focusedBorder, focusStyles.focusedGlow],
        style
      ]}
    >
      <View style={styles.content}>
        {icon && <View style={styles.icon}>{icon}</View>}
        <Text style={[styles.text, vStyles.text]}>{label}</Text>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  base: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: radii.md,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center'
  },
  focused: {
    transform: [{ scale: 1.05 }],
    backgroundColor: colors.primaryHover,
    borderColor: colors.primary
  },
  disabled: {
    opacity: 0.4
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center'
  },
  icon: {
    marginRight: 8
  },
  text: {
    ...typography.bodyMedium,
    fontWeight: '600'
  }
});
