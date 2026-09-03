import React from 'react';
import { View, Text, StyleSheet, ScrollView, Image } from 'react-native';
import { Title } from '@narratv/contracts';
import { colors, typography, spacing, radii } from '../../../core/theme';
import { FocusableCard } from '../../../shared/FocusableCard';
import { Badge } from '../../../shared/Badge';
import { getTitleArtwork } from '../../../shared/artAssets';

export interface MovieRailProps {
  title: string;
  items: Title[];
  selectedTitleId?: string;
  onSelectTitle: (title: Title) => void;
  onFocusTitle: (title: Title) => void;
}

export const MovieRail: React.FC<MovieRailProps> = ({
  title,
  items,
  onSelectTitle,
  onFocusTitle
}) => {
  return (
    <View style={styles.container}>
      <Text style={styles.railTitle}>{title}</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {items.map((item) => (
          <FocusableCard
            key={item.id}
            style={styles.card}
            onPress={() => onSelectTitle(item)}
            onFocus={() => onFocusTitle(item)}
            accessibilityLabel={
              item.id === 'sintel'
                ? `${item.name}, ${item.year}, ${item.genre}. Audio Description track ready.`
                : `${item.name}, ${item.year}, ${item.genre}. Audio description not yet generated.`
            }
            accessibilityHint="Press Select to view details and start playback"
          >
            <Image
              source={getTitleArtwork(item.id, item.posterUrl)}
              style={styles.poster}
              resizeMode="cover"
            />
            <View style={styles.cardInfo}>
              <Text style={styles.itemTitle} numberOfLines={1}>
                {item.name}
              </Text>
              <View style={styles.cardMeta}>
                <Text style={styles.itemMeta}>{item.year} · {item.rating}</Text>
                <Badge
                  label={item.id === 'sintel' ? "AD Track" : "No AD Track"}
                  variant={item.id === 'sintel' ? "pre-generated" : "warning"}
                />
              </View>
            </View>
          </FocusableCard>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: spacing.lg
  },
  railTitle: {
    ...typography.sectionTitle,
    color: colors.textPrimary,
    marginBottom: spacing.md
  },
  scrollContent: {
    gap: spacing.lg,
    paddingVertical: spacing.sm,
    paddingRight: spacing.xxl
  },
  card: {
    width: 240,
    height: 340,
    borderRadius: radii.lg,
    backgroundColor: colors.surface
  },
  poster: {
    width: '100%',
    height: 250,
    backgroundColor: colors.surfaceElevated
  },
  cardInfo: {
    padding: spacing.sm,
    justifyContent: 'space-between',
    flex: 1
  },
  itemTitle: {
    ...typography.cardTitle,
    color: colors.textPrimary,
    fontSize: 18,
    lineHeight: 22
  },
  cardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4
  },
  itemMeta: {
    ...typography.caption,
    color: colors.textSecondary
  }
});
