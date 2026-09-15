import React, { useState } from 'react';
import {
  Pressable,
  View,
  StyleSheet,
  ViewStyle,
  StyleProp,
  AccessibilityRole
} from 'react-native';
import { colors, focusStyles, radii } from '../core/theme';

export interface FocusableCardProps {
  children: React.ReactNode;
  onPress?: () => void;
  onFocus?: () => void;
  onBlur?: () => void;
  style?: StyleProp<ViewStyle>;
  focusedStyle?: StyleProp<ViewStyle>;
  hasTVPreferredFocus?: boolean;
  focusable?: boolean;
  nextFocusUp?: number;
  nextFocusDown?: number;
  nextFocusLeft?: number;
  nextFocusRight?: number;
  accessibilityLabel: string;
  accessibilityHint?: string;
  accessibilityRole?: AccessibilityRole;
  accessibilityState?: {
    disabled?: boolean;
    selected?: boolean;
    checked?: boolean | 'mixed';
    busy?: boolean;
    expanded?: boolean;
  };
}

export const FocusableCard: React.FC<FocusableCardProps> = ({
  children,
  onPress,
  onFocus,
  onBlur,
  style,
  focusedStyle,
  hasTVPreferredFocus,
  focusable,
  nextFocusUp,
  nextFocusDown,
  nextFocusLeft,
  nextFocusRight,
  accessibilityLabel,
  accessibilityHint,
  accessibilityRole = 'button',
  accessibilityState
}) => {
  const [isFocused, setIsFocused] = useState<boolean>(false);

  return (
    <Pressable
      onPress={onPress}
      onFocus={() => {
        setIsFocused(true);
        onFocus?.();
      }}
      onBlur={() => {
        setIsFocused(false);
        onBlur?.();
      }}
      hasTVPreferredFocus={hasTVPreferredFocus}
      focusable={focusable ?? true}
      nextFocusUp={nextFocusUp}
      nextFocusDown={nextFocusDown}
      nextFocusLeft={nextFocusLeft}
      nextFocusRight={nextFocusRight}
      accessible={true}
      accessibilityRole={accessibilityRole}
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ selected: isFocused, ...accessibilityState }}
      style={[
        styles.base,
        style,
        isFocused && [styles.focused, focusStyles.focusedBorder, focusStyles.focusedGlow, focusedStyle]
      ]}
    >
      <View style={styles.inner}>{children}</View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  base: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 2,
    borderColor: 'transparent',
    overflow: 'hidden'
  },
  focused: {
    transform: [{ scale: focusStyles.focusedScale }],
    backgroundColor: colors.surfaceHover
  },
  inner: {
    width: '100%',
    height: '100%'
  }
});
