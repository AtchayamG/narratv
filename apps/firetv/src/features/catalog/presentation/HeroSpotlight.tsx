import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { Title, DescriptionTrack } from '@narratv/contracts';
import { colors, typography, spacing, radii } from '../../../core/theme';
import { Badge } from '../../../shared/Badge';
import { Button } from '../../../shared/Button';
import { getTitleArtwork } from '../../../shared/artAssets';

export interface HeroSpotlightProps {
  title: Title;
  track?: DescriptionTrack | null;
  onPlay: (title: Title) => void;
  onOpenSystemStatus?: () => void;
  hasTVPreferredFocus?: boolean;
}

export const HeroSpotlight: React.FC<HeroSpotlightProps> = ({
  title,
  track,
  onPlay,
  onOpenSystemStatus,
  hasTVPreferredFocus
}) => {
  const hasTrack = Boolean(track && track.metadata && track.metadata.describedCount > 0);
  const describedCount = track?.metadata?.describedCount ?? 0;
  const overlapCount = track?.metadata?.overlapCount ?? 0;
  const statusLabel = track?.status === 'verified' ? 'Verified' : 'AI DRAFT';

  const adBadgeText = hasTrack
    ? `AD TRACK: ${statusLabel} · ${describedCount} DESCRIPTIONS · ${overlapCount} OVERLAPS`
    : `AD TRACK: NOT YET GENERATED · 0 DESCRIPTIONS`;

  return (
    <View style={styles.container}>
      {/* Backdrop Image with gradient scrim */}
      <Image
        source={getTitleArtwork(title.id, title.heroUrl || title.posterUrl)}
        style={styles.backdrop}
        resizeMode="cover"
      />
      <View style={styles.scrimHorizontal} />
      <View style={styles.scrimVertical} />

      {/* Content */}
      <View style={styles.content}>
        <View style={styles.badgesRow}>
          <Badge label={title.rating} variant="default" />
          <Badge label={`${title.year}`} variant="default" />
          <Badge label={title.genre} variant="default" />
          <Badge
            label={adBadgeText}
            variant={track?.status === 'verified' ? 'verified' : 'ai-draft'}
          />
        </View>

        <Text style={styles.titleText}>{title.name}</Text>
        <Text style={styles.synopsisText} numberOfLines={3}>
          {title.synopsis}
        </Text>

        <View style={styles.actionsRow}>
          <Button
            label={hasTrack ? "Play with Narration (AD)" : "Play Video (No AD Track)"}
            variant="primary"
            onPress={() => onPlay(title)}
            hasTVPreferredFocus={hasTVPreferredFocus}
            accessibilityLabel={hasTrack ? `Play ${title.name} with Audio Description. ${adBadgeText}` : `Play ${title.name}. Audio description track not yet generated.`}
            accessibilityHint="Starts video playback"
          />
          {onOpenSystemStatus && (
            <Button
              label="System Status"
              variant="secondary"
              onPress={onOpenSystemStatus}
              accessibilityLabel="System Status and AWS Transparency Diagnostics"
            />
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 420,
    width: '100%',
    position: 'relative',
    borderRadius: radii.xl,
    overflow: 'hidden',
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)'
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
    opacity: 0.85
  },
  scrimHorizontal: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(11, 14, 20, 0.55)'
  },
  scrimVertical: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent'
  },
  content: {
    flex: 1,
    padding: spacing.xl,
    justifyContent: 'flex-end'
  },
  badgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md
  },
  titleText: {
    ...typography.heroTitle,
    fontSize: 40,
    lineHeight: 46,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
    textShadowColor: 'rgba(0, 0, 0, 0.9)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8
  },
  synopsisText: {
    ...typography.bodyLarge,
    fontSize: 18,
    lineHeight: 26,
    color: '#E2E8F0',
    maxWidth: 780,
    marginBottom: spacing.lg,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md
  }
});
