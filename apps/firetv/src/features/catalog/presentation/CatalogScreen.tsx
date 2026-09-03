import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { Title, DescriptionTrack } from '@narratv/contracts';
import { colors, typography, spacing } from '../../../core/theme';
import { TruthPill } from '../../../shared/TruthPill';
import { Button } from '../../../shared/Button';
import { HeroSpotlight } from './HeroSpotlight';
import { MovieRail } from './MovieRail';
import { container } from '../../../core/di';
import { config } from '../../../core/config';
import { announceForAccessibility } from '../../../core/accessibility';

export interface CatalogScreenProps {
  navigation: any;
}

export const CatalogScreen: React.FC<CatalogScreenProps> = ({ navigation }) => {
  const [titles, setTitles] = useState<Title[]>([]);
  const [featuredTitle, setFeaturedTitle] = useState<Title | null>(null);
  const [featuredTrack, setFeaturedTrack] = useState<DescriptionTrack | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadCatalog() {
      try {
        setLoading(true);
        const fetchedTitles = await container.trackRepository.getTitles();
        if (!isMounted) return;

        setTitles(fetchedTitles);
        if (fetchedTitles.length > 0) {
          const initial = fetchedTitles[0];
          setFeaturedTitle(initial);
          try {
            const track = await container.trackRepository.getTrack(initial.id);
            if (isMounted) setFeaturedTrack(track);
          } catch {
            // non-fatal
          }
        }
      } catch (err: any) {
        if (isMounted) setError(err.message || 'Failed to load titles');
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadCatalog();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleFocusTitle = useCallback(async (title: Title) => {
    setFeaturedTitle(title);
    try {
      const track = await container.trackRepository.getTrack(title.id);
      setFeaturedTrack(track);
      if (track && track.metadata && track.metadata.describedCount > 0) {
        announceForAccessibility(`${title.name}, ${title.year}. Audio Description track loaded with ${track.metadata.describedCount} descriptions.`);
      } else {
        announceForAccessibility(`${title.name}, ${title.year}. Audio description track not yet generated.`);
      }
    } catch {
      setFeaturedTrack(null);
      announceForAccessibility(`${title.name}, ${title.year}.`);
    }
  }, []);

  const handlePlayTitle = useCallback((title: Title) => {
    navigation.navigate('Player', { titleId: title.id });
  }, [navigation]);

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading NarraTV Catalog...</Text>
      </View>
    );
  }

  if (error || titles.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorTitle}>Catalog Unavailable</Text>
        <Text style={styles.errorText}>{error || 'No titles found in repository.'}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Top Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.logoText}>NarraTV</Text>
          <Text style={styles.taglineText}>Audio-Described Cinema</Text>
        </View>

        <View style={styles.headerRight}>
          <TruthPill isLive={!config.demoMode} />
          <Button
            label="System Status"
            variant="secondary"
            onPress={() => navigation.navigate('SystemStatus')}
            accessibilityLabel="System Status, view AWS and API connectivity"
          />
        </View>
      </View>

      {/* Hero Spotlight */}
      {featuredTitle && (
        <HeroSpotlight
          title={featuredTitle}
          track={featuredTrack}
          onPlay={handlePlayTitle}
          onOpenSystemStatus={() => navigation.navigate('SystemStatus')}
          hasTVPreferredFocus={true}
        />
      )}

      {/* Media Rail */}
      <MovieRail
        title="Open Cinema (CC-BY Licensed)"
        items={titles}
        selectedTitleId={featuredTitle?.id}
        onSelectTitle={handlePlayTitle}
        onFocusTitle={handleFocusTitle}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background
  },
  contentContainer: {
    paddingHorizontal: spacing.tvSafeHorizontal,
    paddingVertical: spacing.tvSafeVertical
  },
  centerContainer: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl
  },
  loadingText: {
    ...typography.bodyLarge,
    color: colors.textSecondary,
    marginTop: spacing.md
  },
  errorTitle: {
    ...typography.sectionTitle,
    color: colors.error,
    marginBottom: spacing.sm
  },
  errorText: {
    ...typography.bodyLarge,
    color: colors.textSecondary,
    textAlign: 'center'
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.md
  },
  logoText: {
    ...typography.heroTitle,
    fontSize: 32,
    color: colors.primary,
    fontWeight: '900',
    letterSpacing: -0.5
  },
  taglineText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontSize: 16
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md
  }
});
