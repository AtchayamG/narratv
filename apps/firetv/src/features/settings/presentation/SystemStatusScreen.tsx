import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { HealthResponse } from '@narratv/contracts';
import { colors, typography, spacing, radii } from '../../../core/theme';
import { TruthPill } from '../../../shared/TruthPill';
import { Badge } from '../../../shared/Badge';
import { Button } from '../../../shared/Button';
import { Toast } from '../../../shared/Toast';
import { config } from '../../../core/config';
import { announceForAccessibility } from '../../../core/accessibility';

export interface SystemStatusScreenProps {
  navigation: any;
}

export const SystemStatusScreen: React.FC<SystemStatusScreenProps> = ({ navigation }) => {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const fetchHealth = async () => {
    if (config.demoMode) {
      setHealth({
        mode: 'demo',
        providers: {
          bedrock: 'unconfigured',
          polly: 'unconfigured',
          s3: 'unconfigured'
        },
        revision: config.appRevision,
        timestamp: new Date().toISOString()
      });
      return;
    }

    try {
      setLoading(true);
      const url = `${config.apiUrl.replace(/\/$/, '')}/health`;
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`HTTP ${res.status} ${res.statusText}`);
      }
      const data: HealthResponse = await res.json();
      setHealth(data);
      announceForAccessibility(`System health: Mode is ${data.mode}. Bedrock is ${data.providers.bedrock}. Polly is ${data.providers.polly}.`);
    } catch (err: any) {
      setToastMessage(`Failed to reach health endpoint: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
  }, []);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.title}>System Status & Transparency</Text>
          <Text style={styles.subtitle}>Runtime verification, provider connectivity, and architecture invariants</Text>
        </View>
        <TruthPill isLive={!config.demoMode} />
      </View>

      {/* Connectivity Cards Grid */}
      <View style={styles.grid}>
        {/* Runtime Mode Card */}
        <View
          style={styles.card}
          accessible={true}
          accessibilityRole="text"
          accessibilityLabel={`Active runtime mode: ${config.demoMode ? 'Demo mode with bundled fixtures' : 'Live mode with AWS cloud'}`}
        >
          <Text style={styles.cardLabel}>Active Runtime Mode</Text>
          <View style={styles.badgeRow}>
            <Badge
              label={config.demoMode ? 'DEMO MODE (Bundled Fixtures)' : 'LIVE MODE (AWS Cloud)'}
              variant={config.demoMode ? 'ai-draft' : 'verified'}
            />
          </View>
          <Text style={styles.cardDesc}>
            {config.demoMode
              ? 'App operates in offline standalone demo mode with bundled Creative Commons fixtures and deterministic scheduler.'
              : 'App communicates directly with live deployed AWS Bedrock Converse and Amazon Polly endpoints.'}
          </Text>
        </View>

        {/* Bedrock AI Provider Card */}
        <View
          style={styles.card}
          accessible={true}
          accessibilityRole="text"
          accessibilityLabel={`Amazon Bedrock status: ${health?.providers.bedrock === 'ok' ? 'Connected' : (config.demoMode ? 'Unconfigured in demo mode' : 'Error')}`}
        >
          <Text style={styles.cardLabel}>Amazon Bedrock Multimodal</Text>
          <View style={styles.badgeRow}>
            <Badge
              label={health?.providers.bedrock === 'ok' ? 'Connected (Nova Pro)' : (config.demoMode ? 'Unconfigured (Demo)' : 'Error / 503')}
              variant={health?.providers.bedrock === 'ok' ? 'verified' : (config.demoMode ? 'ai-draft' : 'skipped')}
            />
          </View>
          <Text style={styles.cardDesc}>
            Multimodal LLM (`amazon.nova-pro-v1:0`) synthesizing present-tense scene descriptions from video frames.
          </Text>
        </View>

        {/* Amazon Polly Voice Card */}
        <View
          style={styles.card}
          accessible={true}
          accessibilityRole="text"
          accessibilityLabel={`Amazon Polly status: ${health?.providers.polly === 'ok' ? 'Connected' : (config.demoMode ? 'Device TTS fallback' : 'Error')}`}
        >
          <Text style={styles.cardLabel}>Amazon Polly Neural TTS</Text>
          <View style={styles.badgeRow}>
            <Badge
              label={health?.providers.polly === 'ok' ? 'Connected (Neural MP3)' : (config.demoMode ? 'Device TTS Fallback' : 'Error / 503')}
              variant={health?.providers.polly === 'ok' ? 'verified' : (config.demoMode ? 'ai-draft' : 'skipped')}
            />
          </View>
          <Text style={styles.cardDesc}>
            High-fidelity neural speech synthesis with sha256 audio asset caching.
          </Text>
        </View>

        {/* Deterministic Refusal Invariants Card */}
        <View
          style={styles.card}
          accessible={true}
          accessibilityRole="text"
          accessibilityLabel="Deterministic refusal invariants: 0 dialogue overlaps, 2.5 second minimum gap, 300 millisecond guard bands"
        >
          <Text style={styles.cardLabel}>Deterministic Refusal Invariants</Text>
          <View style={styles.badgeRow}>
            <Badge label="0 Dialogue Overlaps" variant="verified" />
            <Badge label="2.5s Minimum Gap" variant="default" />
            <Badge label="300ms Guard Bands" variant="default" />
          </View>
          <Text style={styles.cardDesc}>
            Pure TypeScript scheduler mathematically guarantees no audio description speaks while dialogue is active.
          </Text>
        </View>
      </View>

      {/* Creative Commons Open Movie Credits */}
      <View
        style={styles.creditsCard}
        accessible={true}
        accessibilityRole="text"
        accessibilityLabel="Creative Commons Open Movie Credits. Sintel, Big Buck Bunny, and Elephants Dream by Blender Foundation, licensed CC-BY."
      >
        <Text style={styles.creditsTitle}>Creative Commons Open Movie Credits</Text>
        <Text style={styles.creditsHeader}>
          Sintel, Big Buck Bunny and Elephants Dream © Blender Foundation, licensed CC-BY (durian/peach/orange.blender.org)
        </Text>
        <View style={styles.creditsList}>
          <Text style={styles.creditsItem}>
            • <Text style={styles.creditsBold}>Sintel</Text>: (c) copyright Blender Foundation | durian.blender.org | CC-BY 3.0
          </Text>
          <Text style={styles.creditsItem}>
            • <Text style={styles.creditsBold}>Big Buck Bunny</Text>: (c) copyright 2008, Blender Foundation / www.bigbuckbunny.org | CC-BY 3.0
          </Text>
          <Text style={styles.creditsItem}>
            • <Text style={styles.creditsBold}>Elephants Dream</Text>: (c) copyright 2006, Blender Foundation / Netherlands Media Art Institute / www.elephantsdream.org | CC-BY 2.5
          </Text>
        </View>
        <Text style={styles.creditsFooter}>
          Video streams, subtitles, and extracted stills used under Creative Commons Attribution licenses.
        </Text>
      </View>

      {/* Build Info */}
      <View style={styles.buildInfoBox}>
        <Text style={styles.buildInfoText}>
          App Revision: <Text style={styles.highlight}>{config.appRevision}</Text> · Target OS: <Text style={styles.highlight}>Fire OS / Android TV (API 30+)</Text> · License: <Text style={styles.highlight}>MIT (Open Source)</Text>
        </Text>
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        <Button
          label={loading ? 'Checking...' : 'Refresh Status'}
          variant="primary"
          onPress={fetchHealth}
          disabled={loading}
          hasTVPreferredFocus={true}
          accessibilityLabel="Refresh system health status"
        />
        <Button
          label="Back to Catalog"
          variant="secondary"
          onPress={() => navigation.goBack()}
          accessibilityLabel="Return to movie catalog"
        />
      </View>

      <Toast
        message={toastMessage || ''}
        visible={Boolean(toastMessage)}
        onDismiss={() => setToastMessage(null)}
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xl,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border
  },
  headerLeft: {
    gap: 4
  },
  title: {
    ...typography.heroTitle,
    fontSize: 32,
    color: colors.textPrimary
  },
  subtitle: {
    ...typography.bodyMedium,
    color: colors.textSecondary
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.lg,
    marginBottom: spacing.xl
  },
  card: {
    width: '48%',
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm
  },
  cardLabel: {
    ...typography.sectionTitle,
    fontSize: 20,
    color: colors.textPrimary
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginVertical: 4
  },
  cardDesc: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
    fontSize: 16,
    lineHeight: 22
  },
  creditsCard: {
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    borderRadius: radii.md,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    marginBottom: spacing.lg
  },
  creditsTitle: {
    ...typography.badge,
    color: colors.primary,
    fontSize: 14,
    fontWeight: '700',
    marginBottom: spacing.xs,
    textTransform: 'uppercase'
  },
  creditsHeader: {
    ...typography.bodyLarge,
    color: colors.textPrimary,
    fontWeight: '600',
    marginBottom: spacing.sm,
    fontSize: 16
  },
  creditsList: {
    marginVertical: spacing.xs,
    gap: 4
  },
  creditsItem: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 18
  },
  creditsBold: {
    color: colors.textPrimary,
    fontWeight: '600'
  },
  creditsFooter: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: spacing.sm,
    fontStyle: 'italic'
  },
  buildInfoBox: {
    backgroundColor: colors.surfaceElevated,
    padding: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.xl
  },
  buildInfoText: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
    fontSize: 15
  },
  highlight: {
    color: colors.textPrimary,
    fontWeight: '700'
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.md
  }
});
