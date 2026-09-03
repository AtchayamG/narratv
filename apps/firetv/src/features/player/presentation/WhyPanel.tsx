import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Description } from '@narratv/contracts';
import { colors, typography, spacing, radii } from '../../../core/theme';
import { Badge } from '../../../shared/Badge';
import { Button } from '../../../shared/Button';
import { announceForAccessibility } from '../../../core/accessibility';

export interface WhyPanelProps {
  description: Description | null;
  onClose: () => void;
}

export const WhyPanel: React.FC<WhyPanelProps> = ({ description, onClose }) => {
  useEffect(() => {
    if (description) {
      announceForAccessibility(
        `Why this description? Model: ${description.model}. Confidence: ${(description.confidence * 100).toFixed(0)}%. ${description.text}. Placement rule: ${description.placementRule || 'Calculated by scheduler'}`
      );
    }
  }, [description]);

  if (!description) return null;

  const isSkipped = description.status === 'skipped';
  const confidencePercent = `${(description.confidence * 100).toFixed(0)}%`;

  return (
    <View style={styles.overlay}>
      <View style={styles.panel}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Why This Description?</Text>
          <Button
            label="Close (Back)"
            variant="outline"
            onPress={onClose}
            hasTVPreferredFocus={true}
            accessibilityLabel="Close Why this description panel"
          />
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          {/* Source Frame Reference */}
          <View style={styles.frameContainer}>
            <View style={styles.framePlaceholder}>
              <Text style={styles.frameLabel}>Source Video Frame</Text>
              <Text style={styles.frameRefText}>{description.frameRef}</Text>
            </View>
            <View style={styles.statusBadgeRow}>
              <Badge
                label={isSkipped ? `Skipped: ${description.skipReason || 'refused'}` : (description.status === 'verified' ? 'Verified by Human' : 'AI Draft')}
                variant={isSkipped ? 'skipped' : (description.status === 'verified' ? 'verified' : 'ai-draft')}
              />
              <Badge label={`Model: ${description.model}`} variant="default" />
              <Badge label={`Confidence: ${confidencePercent}`} variant="default" />
            </View>
          </View>

          {/* Description Text */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Generated Scene Narration</Text>
            <Text style={styles.descriptionText}>"{description.text}"</Text>
          </View>

          {/* Deterministic Decision Formula */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Deterministic Placement Rule</Text>
            <View style={styles.ruleBox}>
              <Text style={styles.ruleText}>
                {description.placementRule || `Placed at ${description.tStart.toFixed(1)}s – ${description.tEnd.toFixed(1)}s based on dialogue gap and speech rate budget.`}
              </Text>
            </View>
          </View>

          {/* Timing & Guard Band Specifications */}
          <View style={styles.metaGrid}>
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>Time Window</Text>
              <Text style={styles.metaValue}>{description.tStart.toFixed(1)}s – {description.tEnd.toFixed(1)}s</Text>
            </View>
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>Duration</Text>
              <Text style={styles.metaValue}>{(description.tEnd - description.tStart).toFixed(1)}s</Text>
            </View>
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>Guard Bands</Text>
              <Text style={styles.metaValue}>300ms each end</Text>
            </View>
          </View>
        </ScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'flex-end',
    zIndex: 9000
  },
  panel: {
    width: '45%',
    height: '100%',
    backgroundColor: colors.surface,
    borderLeftWidth: 2,
    borderLeftColor: colors.border,
    padding: spacing.xl
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border
  },
  headerTitle: {
    ...typography.sectionTitle,
    color: colors.textPrimary,
    fontSize: 24
  },
  content: {
    gap: spacing.lg
  },
  frameContainer: {
    gap: spacing.sm
  },
  framePlaceholder: {
    height: 160,
    backgroundColor: colors.surfaceElevated,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.md
  },
  frameLabel: {
    ...typography.caption,
    color: colors.textMuted,
    marginBottom: 4
  },
  frameRefText: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
    fontWeight: '600'
  },
  statusBadgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm
  },
  section: {
    gap: spacing.xs
  },
  sectionLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5
  },
  descriptionText: {
    ...typography.bodyLarge,
    color: colors.textPrimary,
    fontStyle: 'italic',
    lineHeight: 28
  },
  ruleBox: {
    backgroundColor: 'rgba(245, 158, 11, 0.08)',
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
    padding: spacing.md,
    borderRadius: radii.sm
  },
  ruleText: {
    ...typography.bodyMedium,
    color: colors.textPrimary,
    fontWeight: '500'
  },
  metaGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: colors.surfaceElevated,
    padding: spacing.md,
    borderRadius: radii.md
  },
  metaItem: {
    alignItems: 'center'
  },
  metaLabel: {
    ...typography.caption,
    fontSize: 12,
    color: colors.textMuted
  },
  metaValue: {
    ...typography.bodyMedium,
    color: colors.textPrimary,
    fontWeight: '600',
    marginTop: 2
  }
});
