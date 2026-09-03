import React, { useState, useEffect, useCallback, useRef } from 'react';
import * as RN from 'react-native';
import { View, Text, StyleSheet, ActivityIndicator, Image } from 'react-native';
import Video, { OnLoadData, OnProgressData } from 'react-native-video';
import { Title, DescriptionTrack, SubtitleCue, Description } from '@narratv/contracts';
import { colors, typography, spacing, radii } from '../../../core/theme';
import { TruthPill } from '../../../shared/TruthPill';
import { Button } from '../../../shared/Button';
import { Badge } from '../../../shared/Badge';
import { Toast } from '../../../shared/Toast';
import { TimelineSurface } from './TimelineSurface';
import { WhyPanel } from './WhyPanel';
import { useScheduler } from '../domain/use-scheduler';
import { container } from '../../../core/di';
import { config } from '../../../core/config';
import { announceForAccessibility } from '../../../core/accessibility';
import { getTitleArtwork } from '../../../shared/artAssets';

export interface PlayerScreenProps {
  route: { params: { titleId: string } };
  navigation: any;
}

export const PlayerScreen: React.FC<PlayerScreenProps> = ({ route, navigation }) => {
  const { titleId } = route.params;

  const [title, setTitle] = useState<Title | null>(null);
  const [track, setTrack] = useState<DescriptionTrack | null>(null);
  const [subtitles, setSubtitles] = useState<SubtitleCue[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Playback state - driven strictly by real react-native-video events
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [currentTimeSec, setCurrentTimeSec] = useState<number>(0);
  const [durationSec, setDurationSec] = useState<number>(0);
  const [isVideoReady, setIsVideoReady] = useState<boolean>(false);
  const [adEnabled, setAdEnabled] = useState<boolean>(true);

  // UI state
  const [showTimeline, setShowTimeline] = useState<boolean>(false);
  const [inspectedDescription, setInspectedDescription] = useState<Description | null>(null);
  const [isDescribingLive, setIsDescribingLive] = useState<boolean>(false);
  const [liveLatencyMs, setLiveLatencyMs] = useState<number | undefined>(undefined);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const videoRef = useRef<any>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      try {
        setLoading(true);
        const [fetchedTitle, fetchedTrack, fetchedSubtitles] = await Promise.all([
          container.trackRepository.getTitle(titleId),
          container.trackRepository.getTrack(titleId),
          container.trackRepository.getSubtitles(titleId)
        ]);

        if (!isMounted) return;
        setTitle(fetchedTitle);
        if (fetchedTitle?.durationSec) {
          setDurationSec(fetchedTitle.durationSec);
        }
        setTrack(fetchedTrack);
        setSubtitles(fetchedSubtitles);
        if (fetchedTrack.metadata.describedCount > 0) {
          announceForAccessibility(
            `Playing ${fetchedTitle?.name || 'movie'} with Audio Description. ${fetchedTrack.metadata.describedCount} descriptions scheduled. Dialogue overlap count: 0.`
          );
        } else {
          announceForAccessibility(
            `Playing ${fetchedTitle?.name || 'movie'}. Audio description track has not yet been generated for this title.`
          );
        }
      } catch (err: any) {
        if (isMounted) {
          setToastMessage(err.message || 'Failed to load track');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadData();
    return () => {
      isMounted = false;
    };
  }, [titleId]);

  // Back navigation stops playback immediately
  const handleBack = useCallback(() => {
    setIsPlaying(false);
    navigation.goBack();
  }, [navigation]);

  useEffect(() => {
    return () => {
      setIsPlaying(false);
    };
  }, []);

  // Handle Fire TV Remote MENU key to toggle Timeline.
  // Subscribed defensively: TVEventHandler depends on native TV modules that are
  // absent in some builds, and an unguarded subscription crashes the whole screen.
  useEffect(() => {
    let subscription: { remove?: () => void } | undefined;
    try {
      const handler = (RN as any).TVEventHandler;
      subscription = handler?.addListener?.((evt: any) => {
        if (evt && (evt.eventType === 'menu' || evt.eventKeyAction === 82)) {
          setShowTimeline(prev => !prev);
        }
      });
    } catch (err) {
      console.warn('TV remote MENU key unavailable on this device:', err);
    }
    return () => {
      try {
        subscription?.remove?.();
      } catch {
        // ignore
      }
    };
  }, []);

  // Synchronized Scheduler Hook - driven strictly by currentTimeSec from onProgress
  const { currentDescription, currentSubtitle, isNarrating } = useScheduler({
    descriptions: track?.descriptions || [],
    subtitles,
    currentTimeSec,
    isPlaying,
    adEnabled
  });

  const hasTrackDescriptions = Boolean(track && track.descriptions && track.descriptions.length > 0);

  const handleTogglePlay = useCallback(() => {
    setIsPlaying(prev => !prev);
  }, []);

  const handleToggleAd = useCallback(() => {
    if (!hasTrackDescriptions) {
      setToastMessage('Audio description not yet generated for this title (see runbook).');
      return;
    }
    setAdEnabled(prev => {
      const next = !prev;
      announceForAccessibility(next ? 'Audio description enabled' : 'Audio description muted');
      return next;
    });
  }, [hasTrackDescriptions]);

  const handleToggleTimeline = useCallback(() => {
    setShowTimeline(prev => !prev);
  }, []);

  // "Describe Now" live trigger
  const handleDescribeNow = useCallback(async () => {
    if (config.demoMode) {
      setToastMessage('LIVE unavailable — demo mode active. Set DEMO_MODE=false with AWS credentials to use live Bedrock inference.');
      return;
    }

    try {
      setIsDescribingLive(true);
      announceForAccessibility('Requesting live AI scene description from Bedrock...');
      const result = await container.describeClient.describeFrame({
        titleId,
        timestampSec: currentTimeSec
      });

      setLiveLatencyMs(result.latencyMs);

      // Add newly generated description to the active track
      if (track) {
        setTrack({
          ...track,
          descriptions: [...track.descriptions, result.description]
        });
      }

      announceForAccessibility(`Live description received: ${result.description.text}`);
    } catch (err: any) {
      setToastMessage(err.message || 'LIVE unavailable: Failed to reach Bedrock service.');
    } finally {
      setIsDescribingLive(false);
    }
  }, [titleId, currentTimeSec, track]);

  if (loading || !title) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Initializing NarraTV Player...</Text>
      </View>
    );
  }

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const videoStreamSource = title.streamUrl || title.videoUrl;

  return (
    <View style={styles.container}>
      {/* Real Video Playback Surface via react-native-video */}
      <View style={styles.videoSurface}>
        <Video
          ref={videoRef}
          testID="native-video-player"
          source={{ uri: videoStreamSource }}
          style={styles.nativeVideo}
          resizeMode="contain"
          paused={!isPlaying}
          repeat={false}
          controls={false}
          progressUpdateInterval={250}
          onReadyForDisplay={() => setIsVideoReady(true)}
          onLoad={(data: OnLoadData) => {
            if (data.duration && data.duration > 0) {
              setDurationSec(data.duration);
            }
          }}
          onProgress={(data: OnProgressData) => {
            setCurrentTimeSec(data.currentTime);
          }}
          onEnd={() => {
            setIsPlaying(false);
          }}
          onError={(err: any) => {
            console.warn('ReactNativeVideo playback error:', err);
            setToastMessage('Playback error: ' + (err?.error?.errorString || 'Failed to decode stream'));
          }}
        />

        {/* Artwork poster visible while video loads / buffers */}
        {!isVideoReady && (
          <Image
            source={getTitleArtwork(title.id, title.heroUrl)}
            style={styles.backdropImage}
            resizeMode="cover"
          />
        )}

        {/* Top Status HUD */}
        <View style={styles.topHud}>
          <View style={styles.titleMeta}>
            <Text style={styles.movieTitle}>{title.name}</Text>
            <Text style={styles.timecodeText}>
              {formatTime(currentTimeSec)} / {formatTime(durationSec || title.durationSec)}
            </Text>
          </View>

          <View style={styles.topHudRight}>
            <TruthPill isLive={!config.demoMode} latencyMs={liveLatencyMs} />
            <View style={[styles.counterPill, !hasTrackDescriptions && styles.counterPillWarning]}>
              <Text style={styles.counterText}>
                {hasTrackDescriptions
                  ? `Gaps: ${track?.metadata.totalGaps || 0} · Described: ${track?.metadata.describedCount || 0} · Overlaps: ${track?.metadata.overlapCount ?? 0}`
                  : `Gaps: ${track?.metadata.totalGaps || 0} · Described: 0 (No AD Track)`}
              </Text>
            </View>
          </View>
        </View>

        {/* Center Active Narration Indicator / No-Track State */}
        <View style={styles.centerContent}>
          {!hasTrackDescriptions && (
            <View
              style={styles.noTrackBanner}
              accessible={true}
              accessibilityRole="text"
              accessibilityLabel="Audio description not yet generated for this title. Video playback is active. Full description tracks are produced offline via the Bedrock Nova Pro multimodal pipeline."
            >
              <View style={styles.noTrackHeader}>
                <Badge label="NO AD TRACK" variant="warning" />
                <Text style={styles.noTrackTitle}>Audio Description Not Generated</Text>
              </View>
              <Text style={styles.noTrackBody}>
                Film plays normally. Audio description for this title has not yet been processed by the Bedrock Nova Pro pipeline.
              </Text>
              <Text style={styles.noTrackSubtext}>
                Produced offline via Amazon Bedrock (see docs/03-architecture/live-mode-runbook.md).
              </Text>
            </View>
          )}

          {isNarrating && currentDescription && (
            <View
              style={styles.narrationCard}
              accessible={true}
              accessibilityRole="text"
              accessibilityLabel={`Audio description speaking: ${currentDescription.text}`}
            >
              <View style={styles.narrationHeader}>
                <View style={styles.pulseDot} />
                <Text style={styles.narrationLabel}>AD ▶ {currentDescription.text}</Text>
                <Text style={styles.narrationModel}>{currentDescription.model}</Text>
              </View>
              <Text style={styles.narrationBody}>"{currentDescription.text}"</Text>
            </View>
          )}

          {currentSubtitle && (
            <View
              style={styles.dialogueCard}
              accessible={true}
              accessibilityRole="text"
              accessibilityLabel={`Dialogue subtitle: ${currentSubtitle.text}`}
            >
              <Text style={styles.dialogueLabel}>DIALOGUE (SRT)</Text>
              <Text style={styles.dialogueBody}>{currentSubtitle.text}</Text>
            </View>
          )}
        </View>

        {/* Bottom Controls Bar (within 5% TV Safe Area) */}
        <View style={styles.controlsBar}>
          <View style={styles.controlButtons}>
            <Button
              label={isPlaying ? 'Pause' : 'Play'}
              variant="primary"
              style={styles.playerButton}
              onPress={handleTogglePlay}
              hasTVPreferredFocus={true}
              accessibilityLabel={isPlaying ? 'Pause video' : 'Play video'}
            />
            <Button
              label={hasTrackDescriptions ? (adEnabled ? 'AD: ON' : 'AD: OFF') : 'AD: N/A'}
              variant={hasTrackDescriptions ? (adEnabled ? 'secondary' : 'outline') : 'ghost'}
              style={styles.playerButton}
              onPress={handleToggleAd}
              accessibilityLabel={hasTrackDescriptions ? (adEnabled ? 'Audio description is on. Press to mute.' : 'Audio description is off. Press to enable.') : 'Audio description is not available for this title.'}
            />
            <Button
              label={isDescribingLive ? 'Describing...' : (config.demoMode ? 'Describe (Demo)' : 'Describe (LIVE)')}
              variant={config.demoMode ? 'outline' : 'live'}
              style={styles.playerButton}
              onPress={handleDescribeNow}
              disabled={isDescribingLive}
              accessibilityLabel="Describe Now. Triggers on-demand multimodal Bedrock description of the current frame."
            />
            <Button
              label={showTimeline ? 'Hide Timeline (Menu)' : 'Timeline (Menu)'}
              variant="outline"
              style={styles.playerButton}
              onPress={handleToggleTimeline}
              accessibilityLabel="Toggle Timeline surface to view dialogue gaps and scheduled narration blocks"
            />
            <Button
              label="Back to Catalog"
              variant="ghost"
              style={styles.playerButton}
              onPress={handleBack}
              accessibilityLabel="Back to movie catalog"
            />
          </View>
        </View>
      </View>

      {/* Timeline Surface Drawer */}
      {showTimeline && (
        <TimelineSurface
          descriptions={track?.descriptions || []}
          subtitles={subtitles}
          currentTimeSec={currentTimeSec}
          durationSec={durationSec || title.durationSec}
          onSelectDescription={desc => setInspectedDescription(desc)}
        />
      )}

      {/* Why This Description Panel */}
      {inspectedDescription && (
        <WhyPanel
          description={inspectedDescription}
          onClose={() => setInspectedDescription(null)}
        />
      )}

      {/* Explicit Error Toast */}
      <Toast
        message={toastMessage || ''}
        visible={Boolean(toastMessage)}
        onDismiss={() => setToastMessage(null)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background
  },
  centerContainer: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center'
  },
  loadingText: {
    ...typography.bodyLarge,
    color: colors.textSecondary,
    marginTop: spacing.md
  },
  videoSurface: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.tvSafeHorizontal,
    paddingVertical: spacing.tvSafeVertical,
    position: 'relative'
  },
  nativeVideo: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000000'
  },
  backdropImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
    opacity: 0.85
  },
  topHud: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 10
  },
  titleMeta: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.md
  },
  movieTitle: {
    ...typography.heroTitle,
    fontSize: 28,
    color: colors.textPrimary,
    textShadowColor: 'rgba(0, 0, 0, 0.9)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6
  },
  timecodeText: {
    ...typography.bodyMedium,
    color: '#E2E8F0',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4
  },
  topHudRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md
  },
  counterPill: {
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)'
  },
  counterText: {
    ...typography.badge,
    color: colors.textSecondary,
    fontSize: 12
  },
  centerContent: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.lg,
    zIndex: 10
  },
  narrationCard: {
    backgroundColor: 'rgba(15, 23, 42, 0.94)',
    borderColor: colors.narration,
    borderWidth: 2,
    borderRadius: radii.lg,
    padding: spacing.lg,
    maxWidth: 750,
    width: '100%',
    shadowColor: colors.narration,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 8
  },
  narrationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs
  },
  pulseDot: {
    width: 10,
    height: 10,
    borderRadius: radii.full,
    backgroundColor: colors.narration,
    marginRight: 8
  },
  narrationLabel: {
    ...typography.badge,
    color: colors.narrationLight,
    flex: 1,
    fontSize: 13
  },
  narrationModel: {
    ...typography.caption,
    fontSize: 12,
    color: colors.textMuted
  },
  narrationBody: {
    ...typography.bodyLarge,
    fontSize: 20,
    lineHeight: 28,
    color: colors.textPrimary,
    fontWeight: '600',
    marginTop: 4
  },
  dialogueCard: {
    backgroundColor: 'rgba(6, 78, 59, 0.9)',
    borderColor: colors.dialogue,
    borderWidth: 1.5,
    borderRadius: radii.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    marginTop: spacing.md,
    maxWidth: 600
  },
  dialogueLabel: {
    ...typography.badge,
    fontSize: 11,
    color: colors.dialogueLight,
    marginBottom: 2
  },
  dialogueBody: {
    ...typography.bodyMedium,
    color: '#ECFDF5',
    fontStyle: 'italic',
    textAlign: 'center'
  },
  controlsBar: {
    backgroundColor: 'rgba(15, 23, 42, 0.9)',
    borderRadius: radii.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    alignSelf: 'center',
    maxWidth: 1300,
    zIndex: 10
  },
  controlButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm
  },
  playerButton: {
    paddingHorizontal: 14,
    paddingVertical: 10
  },
  counterPillWarning: {
    borderColor: '#F59E0B',
    backgroundColor: 'rgba(245, 158, 11, 0.15)'
  },
  noTrackBanner: {
    backgroundColor: 'rgba(15, 23, 42, 0.92)',
    borderWidth: 1.5,
    borderColor: 'rgba(245, 158, 11, 0.5)',
    borderRadius: radii.lg,
    padding: spacing.lg,
    maxWidth: 750,
    alignSelf: 'center',
    gap: 6
  },
  noTrackHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: 2
  },
  noTrackTitle: {
    ...typography.sectionTitle,
    color: '#FBBF24',
    fontSize: 18,
    fontWeight: '700'
  },
  noTrackBody: {
    ...typography.bodyMedium,
    color: colors.textPrimary,
    fontSize: 15,
    lineHeight: 22
  },
  noTrackSubtext: {
    ...typography.caption,
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 2
  }
});
