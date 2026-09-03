import { TextStyle } from 'react-native';

export const typography: Record<string, TextStyle> = {
  heroTitle: {
    fontFamily: 'SpaceGrotesk',
    fontSize: 36,
    lineHeight: 44,
    fontWeight: '800',
    letterSpacing: -0.5
  },
  sectionTitle: {
    fontFamily: 'SpaceGrotesk',
    fontSize: 28,
    lineHeight: 36,
    fontWeight: '700',
    letterSpacing: -0.2
  },
  cardTitle: {
    fontFamily: 'SpaceGrotesk',
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '600'
  },
  bodyLarge: {
    fontFamily: 'Inter',
    fontSize: 20,
    lineHeight: 28,
    fontWeight: '400'
  },
  bodyMedium: {
    fontFamily: 'Inter',
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '400'
  },
  caption: {
    fontFamily: 'Inter',
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '500'
  },
  badge: {
    fontFamily: 'SpaceGrotesk',
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5
  }
};
