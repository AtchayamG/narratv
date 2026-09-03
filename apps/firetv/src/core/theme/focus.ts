import { ViewStyle } from 'react-native';
import { colors } from './colors';

export const focusStyles: {
  focusedBorder: ViewStyle;
  focusedGlow: ViewStyle;
  focusedScale: number;
} = {
  focusedBorder: {
    borderColor: colors.primary,
    borderWidth: 3
  },
  focusedGlow: {
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 14,
    elevation: 12
  },
  focusedScale: 1.06
};
