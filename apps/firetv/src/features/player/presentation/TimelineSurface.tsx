import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Description, SubtitleCue } from '@narratv/contracts';
import { colors, typography, spacing, radii } from '../../../core/theme';
import { FocusableCard } from '../../../shared/FocusableCard';
import { Badge } from '../../../shared/Badge';

export interface TimelineSurfaceProps {
  descriptions: Description[];
  subtitles: SubtitleCue[];
  currentTimeSec: number;
  durationSec: number;
  onSelectDescription?: (desc: Description) => void;
}

export const TimelineSurface: React.FC<TimelineSurfaceProps> = ({
  descriptions,
  subtitles,
  currentTimeSec,
  durationSec,
  onSelectDescription
}) => {
  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Combine items chronologically for the visual scrubber rail
  const items = [
    ...subtitles.map(c => ({ type: 'dialogue' as const, data: c, tStart: c.tStart, tEnd: c.tEnd })),
    ...descriptions.map(d => ({
      type: d.status === 'skipped' ? ('skipped' as const) : ('narration' as const),
      data: d,
      tStart: d.tStart,
      tEnd: d.tEnd
    }))
  ].sort((a, b) => a.tStart - b.tStart);

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.headerTitle}>Deterministic Narration Timeline</Text>
        <View style={styles.legendRow}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: colors.dialogue }]} />
            <Text style={styles.legendText}>Dialogue (SRT)</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: colors.narration }]} />
            <Text style={styles.legendText}>Audio Description (AD)</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: colors.skipped }]} />
            <Text style={styles.legendText}>Refused / Skipped</Text>
          </View>
        </View>
      </View>

      {/* Scrubber Overview Bar */}
      <View style={styles.trackBar}>
        {/* Playhead */}
        <View
          style={[
            styles.playhead,
            { left: `${Math.min(100, Math.max(0, (currentTimeSec / (durationSec || 1)) * 100))}%` }
          ]}
        />
      </View>

      {/* Detailed Chronological Block List */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.blockScroll}
      >
        {items.map((item, idx) => {
          if (item.type === 'dialogue') {
            const cue = item.data as SubtitleCue;
            const isActive = currentTimeSec >= cue.tStart && currentTimeSec <= cue.tEnd;
            return (
              <FocusableCard
                key={`cue-${cue.id}-${idx}`}
                style={[
                  styles.blockCard,
                  styles.dialogueCard,
                  isActive && styles.activeCard
                ]}
                accessibilityLabel={`Dialogue from ${formatTime(cue.tStart)} to ${formatTime(cue.tEnd)}: ${cue.text}`}
                accessibilityHint="Spoken speech detected by subtitles"
              >
                <View style={styles.blockHeader}>
                  <Badge label="Dialogue" variant="dialogue" />
                  <Text style={styles.timecode}>{formatTime(cue.tStart)} - {formatTime(cue.tEnd)}</Text>
                </View>
                <Text style={styles.dialogueText} numberOfLines={2}>{cue.text}</Text>
              </FocusableCard>
            );
          }

          const desc = item.data as Description;
          const isSkipped = desc.status === 'skipped';
          const isActive = !isSkipped && currentTimeSec >= desc.tStart && currentTimeSec <= desc.tEnd;

          return (
            <FocusableCard
              key={`desc-${desc.id}-${idx}`}
              style={[
                styles.blockCard,
                isSkipped ? styles.skippedCard : styles.narrationCard,
                isActive && styles.activeCard
              ]}
              hasTVPreferredFocus={idx === 0}
              onPress={() => onSelectDescription?.(desc)}
              accessibilityLabel={`${isSkipped ? 'Skipped description' : 'Narration'} at ${formatTime(desc.tStart)}: ${desc.text}. ${desc.placementRule || ''}`}
              accessibilityHint="Press Select to view decision and source frame details in WhyPanel"
            >
              <View style={styles.blockHeader}>
                <Badge
                  label={isSkipped ? `Skipped: ${desc.skipReason || 'refused'}` : (desc.status === 'verified' ? 'Verified AD' : 'AI Draft AD')}
                  variant={isSkipped ? 'skipped' : (desc.status === 'verified' ? 'verified' : 'ai-draft')}
                />
                <Text style={styles.timecode}>{formatTime(desc.tStart)} - {formatTime(desc.tEnd)}</Text>
              </View>
              <Text style={styles.narrationText} numberOfLines={2}>{desc.text}</Text>
              <Text style={styles.ruleSnippet} numberOfLines={1}>
                {desc.placementRule || `Confidence ${(desc.confidence * 100).toFixed(0)}%`}
              </Text>
            </FocusableCard>
          );
        })}
      </ScrollView>
    </View>
  );
};

/**
 * The timeline is an OVERLAY, not a dock.
 *
 * It used to be a sibling of the video surface in a column, 240dp tall. On a
 * 1080p Fire TV at 2x density that is 480 real pixels - it took forty-five
 * percent of the screen and pushed the film into a letterbox inside a
 * letterbox: the surface went to 16:9-minus-the-panel, so `resizeMode="contain"`
 * fitted a 2.39:1 film by height and put black bars down both sides as well.
 * A viewer opening a diagnostic panel expects to see the panel, not to lose the
 * picture.
 *
 * Now it floats over the bottom of a full-screen video at 168dp, and the
 * player lifts its own chrome above it while it is open.
 */
export const TIMELINE_OVERLAY_HEIGHT = 168;

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: TIMELINE_OVERLAY_HEIGHT,
    backgroundColor: 'rgba(15, 23, 42, 0.92)',
    borderTopWidth: 2,
    borderTopColor: colors.border,
    paddingHorizontal: spacing.tvSafeHorizontal,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
    zIndex: 12
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2
  },
  headerTitle: {
    ...typography.sectionTitle,
    fontSize: 17,
    color: colors.textPrimary
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: radii.full
  },
  legendText: {
    ...typography.caption,
    color: colors.textSecondary
  },
  trackBar: {
    height: 6,
    backgroundColor: colors.surfaceElevated,
    borderRadius: radii.full,
    marginVertical: 6,
    position: 'relative'
  },
  playhead: {
    position: 'absolute',
    top: -3,
    width: 12,
    height: 12,
    borderRadius: radii.full,
    backgroundColor: colors.primary,
    marginLeft: -6
  },
  blockScroll: {
    gap: spacing.sm,
    paddingVertical: 2
  },
  blockCard: {
    width: 232,
    // 104 is not arbitrary. The card carries a badge row, two lines of
    // description and one line of placement rule; at 96 the rule line clipped
    // against the card edge, and the rule is the proof a judge is meant to
    // read. 104 still leaves the whole panel inside TIMELINE_OVERLAY_HEIGHT:
    // 12 padding + 24 header + 18 track bar + 4 scroll inset + 104 = 162 of 168.
    height: 104,
    padding: spacing.sm,
    justifyContent: 'space-between'
  },
  dialogueCard: {
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    borderColor: 'rgba(16, 185, 129, 0.3)'
  },
  narrationCard: {
    backgroundColor: 'rgba(59, 130, 246, 0.12)',
    borderColor: 'rgba(59, 130, 246, 0.35)'
  },
  skippedCard: {
    backgroundColor: 'rgba(100, 116, 139, 0.12)',
    borderColor: 'rgba(100, 116, 139, 0.35)'
  },
  activeCard: {
    borderColor: colors.primary,
    borderWidth: 2
  },
  blockHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  timecode: {
    ...typography.caption,
    fontSize: 12,
    color: colors.textSecondary
  },
  dialogueText: {
    ...typography.bodyMedium,
    color: colors.dialogueLight,
    fontStyle: 'italic',
    fontSize: 14
  },
  narrationText: {
    ...typography.bodyMedium,
    color: colors.textPrimary,
    fontSize: 14
  },
  ruleSnippet: {
    ...typography.caption,
    fontSize: 11,
    color: colors.textMuted
  }
});
