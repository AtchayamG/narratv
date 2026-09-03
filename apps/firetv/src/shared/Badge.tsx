import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, typography, radii } from '../core/theme';

export type BadgeVariant = 'ai-draft' | 'verified' | 'skipped' | 'pre-generated' | 'dialogue' | 'default';

export interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
}

export const Badge: React.FC<BadgeProps> = ({ label, variant = 'default' }) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'verified':
        return {
          container: { backgroundColor: 'rgba(16, 185, 129, 0.15)', borderColor: colors.verified },
          text: { color: colors.verified }
        };
      case 'ai-draft':
        return {
          container: { backgroundColor: 'rgba(245, 158, 11, 0.15)', borderColor: colors.aiDraft },
          text: { color: colors.aiDraft }
        };
      case 'pre-generated':
        return {
          container: { backgroundColor: 'rgba(59, 130, 246, 0.15)', borderColor: colors.narration },
          text: { color: colors.narration }
        };
      case 'dialogue':
        return {
          container: { backgroundColor: 'rgba(16, 185, 129, 0.15)', borderColor: colors.dialogue },
          text: { color: colors.dialogue }
        };
      case 'skipped':
        return {
          container: { backgroundColor: 'rgba(100, 116, 139, 0.15)', borderColor: colors.skipped },
          text: { color: colors.skipped }
        };
      default:
        return {
          container: { backgroundColor: colors.surfaceElevated, borderColor: colors.border },
          text: { color: colors.textSecondary }
        };
    }
  };

  const vStyle = getVariantStyles();

  return (
    <View style={[styles.container, vStyle.container]}>
      <Text style={[styles.text, vStyle.text]}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radii.sm,
    borderWidth: 1,
    alignSelf: 'flex-start'
  },
  text: {
    ...typography.badge,
    fontSize: 12
  }
});
