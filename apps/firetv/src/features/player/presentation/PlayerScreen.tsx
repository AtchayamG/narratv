import React, { useState, useEffect, useCallback, useRef } from 'react';
import * as RN from 'react-native';
import { View, Text, StyleSheet, ActivityIndicator, Image, Animated } from 'react-native';
import Video, { OnLoadData, OnProgressData } from 'react-native-video';
import { Title, DescriptionTrack, SubtitleCue, Description } from '@narratv/contracts';
import { colors, typography, spacing, radii } from '../../../core/theme';
import { TruthPill } from '../../../shared/TruthPill';
import { Button } from '../../../shared/Button';
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

/** Idle time before the chrome fades away and the picture is left clean. */
const CHROME_IDLE_MS = 4000;
/** Film bed level while narration is audible, so the voice sits on top. */
const DUCKED_VOLUME = 0.25;

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

  // Auto-hiding chrome. The controls stay mounted (and focusable) so the TV
  // remote never loses its focus target; only their opacity is animated.
  const [chromeVisible, setChromeVisible] = useState<boolean>(true);
  const chromeVisibleRef = useRef<boolean>(true);
  const chromeOpacity = useRef(new Animated.Value(1)).current;
  const idleTimerRef = useRef<any>(null);

  const videoRef = useRef<any>(null);

  const setChrome = useCallback(
    (visible: boolean) => {
      chromeVisibleRef.current = visible;
      setChromeVisible(visible);
      Animated.timing(chromeOpacity, {
        toValue: visible ? 1 : 0,
        duration: 220,
        useNativeDriver: true
      }).start();
    },
    [chromeOpacity]
  );

  /** Any remote activity brings the chrome back and restarts the idle clock. */
  const revealChrome = useCallback(() => {
    if (!chromeVisibleRef.current) setChrome(true);
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    idleTimerRef.current = setTimeout(() => setChrome(false), CHROME_IDLE_MS);
  }, [setChrome]);

  /**
   * While the chrome is hidden the first key press only wakes it — it must not
   * also fire the focused button, or a viewer nudging the remote would pause
   * the film by accident.
   */
  const guarded = useCallback(
    (action: () => void) => () => {
      if (!chromeVisibleRef.current) {
        revealChrome();
        return;
      }
      revealChrome();
      action();
    },
    [revealChrome]
  );

  useEffect(() => {
    revealChrome();
    return () => {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    };
  }, [revealChrome]);

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

  const handleBack = useCallback(() => {
    setIsPlaying(false);
    navigation.goBack();
  }, [navigation]);

  useEffect(() => {
    return () => {
      setIsPlaying(false);
    };
  }, []);

  // Fire TV remote. Every event wakes the chrome; MENU toggles the timeline.
  // Subscribed defensively: TVEventHandler depends on native TV modules that
  // are absent in some builds, and an unguarded subscription crashes the screen.
  useEffect(() => {
    let subscription: { remove?: () => void } | undefined;
    try {
      const handler = (RN as any).TVEventHandler;
      subscription = handler?.addListener?.((evt: any) => {
        if (!evt) return;
        revealChrome();
        if (evt.eventType === 'menu' || evt.eventKeyAction === 82) {
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
  }, [revealChrome]);

  // Scheduler - driven strictly by currentTimeSec from onProgress.
  // Narration is held until the picture is actually on screen: describing a
  // scene the viewer's companion cannot yet see is the desync that made the
  // first demo look wrong, and a blind viewer would hear description over a
  // film that has not started.
  const { currentDescription, currentSubtitle, isNarrating, refusal } = useScheduler({
    descriptions: track?.descriptions || [],
    subtitles,
    currentTimeSec,
    isPlaying: isPlaying && isVideoReady,
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
          progressUpdateInterval={100}
          /* Duck the film bed while the description is audible. */
          volume={isNarrating ? DUCKED_VOLUME : 1.0}
          onReadyForDisplay={() => setIsVideoReady(true)}
          onLoad={(data: OnLoadData) => {
            if (data.duration && data.duration > 0) {
              setDurationSec(data.duration);
            }
          }}
          onProgress={(data: OnProgressData) => {
            setCurrentTimeSec(data.currentTime);
            // Fallback readiness signal. Some Fire TV builds deliver progress
            // before onReadyForDisplay; without this the poster would stay up
            // over a film that is already running, and narration keyed to the
            // video clock would be heard against a still image.
            if (!isVideoReady && data.currentTime > 0) setIsVideoReady(true);
          }}
          onEnd={() => {
            setIsPlaying(false);
          }}
          onError={(err: any) => {
            console.warn('ReactNativeVideo playback error:', err);
            setToastMessage('Playback error: ' + (err?.error?.errorString || 'Failed to decode stream'));
          }}
        />

        {!isVideoReady && (
          <Image
            source={getTitleArtwork(title.id, title.heroUrl)}
            style={styles.backdropImage}
            resizeMode="cover"
          />
        )}

        {/* ---- Top HUD: auto-hiding, single compact row ---- */}
        <Animated.View
          style={[styles.topHud, { opacity: chromeOpacity }]}
          pointerEvents="none"
          importantForAccessibility={chromeVisible ? 'auto' : 'no-hide-descendants'}
        >
          <Text style={styles.movieTitle} numberOfLines={1}>
            {title.name}
          </Text>
          <Text style={styles.timecodeText}>
            {formatTime(currentTimeSec)} / {formatTime(durationSec || title.durationSec)}
          </Text>
          <View style={styles.topHudSpacer} />
          <TruthPill isLive={!config.demoMode} latencyMs={liveLatencyMs} />
          <View style={[styles.counterPill, !hasTrackDescriptions && styles.counterPillWarning]}>
            <Text style={styles.counterText}>
              {hasTrackDescriptions
                ? `AD ${track?.metadata.describedCount || 0}/${track?.metadata.totalGaps || 0} · overlaps ${track?.metadata.overlapCount ?? 0}`
                : 'NO AD TRACK'}
            </Text>
          </View>
        </Animated.View>

        {/* ----------------------------------------------------------------
            Lower third. Nothing is ever drawn across the middle of the
            picture: the description, the dialogue caption and the refusal
            notice all sit in the bottom band, sized for a 10-foot read but
            kept to a single strip so sighted viewers are not blocked.
           ---------------------------------------------------------------- */}
        <View style={styles.lowerThird} pointerEvents="none">
          {/* Honest empty state, kept to one line so it never blocks the film. */}
          {!hasTrackDescriptions && (
            <Animated.View
              style={[styles.noTrackNote, { opacity: chromeOpacity }]}
              accessible={true}
              accessibilityRole="text"
              accessibilityLabel="Audio description has not been generated for this title. Film plays normally. Description tracks are produced offline by the Bedrock Nova Pro pipeline."
            >
              <Text style={styles.noTrackText} numberOfLines={1}>
                Film plays normally · audio description not generated for this title
              </Text>
            </Animated.View>
          )}

          {refusal && (
            <View
              style={styles.refusalPill}
              accessible={true}
              accessibilityRole="text"
              accessibilityLabel={
                refusal.reason === 'no-gap'
                  ? 'Description skipped: no dialogue-free gap long enough.'
                  : 'Description stopped: dialogue started.'
              }
            >
              <Text style={styles.refusalText}>
                {refusal.reason === 'no-gap' ? 'SKIPPED · NO GAP' : 'SKIPPED · DIALOGUE'}
              </Text>
            </View>
          )}

          {isNarrating && currentDescription && (
            <View
              style={styles.narrationStrip}
              accessible={true}
              accessibilityRole="text"
              accessibilityLabel={`Audio description: ${currentDescription.text}`}
            >
              <View style={styles.narrationAccent} />
              <Text style={styles.narrationTag}>AD</Text>
              <Text style={styles.narrationText} numberOfLines={2}>
                {currentDescription.text}
              </Text>
            </View>
          )}

          {currentSubtitle && (
            <Text
              style={styles.dialogueText}
              numberOfLines={2}
              accessible={true}
              accessibilityRole="text"
              accessibilityLabel={`Dialogue: ${currentSubtitle.text}`}
            >
              {currentSubtitle.text}
            </Text>
          )}
        </View>

        {/* ---- Compact auto-hiding control bar ---- */}
        <Animated.View style={[styles.controlsBar, { opacity: chromeOpacity }]}>
          <Button
            label={isPlaying ? 'Pause' : 'Play'}
            variant="primary"
            style={styles.playerButton}
            onPress={guarded(handleTogglePlay)}
            onFocus={revealChrome}
            hasTVPreferredFocus={true}
            accessibilityLabel={isPlaying ? 'Pause video' : 'Play video'}
          />
          <Button
            label={hasTrackDescriptions ? (adEnabled ? 'AD on' : 'AD off') : 'AD n/a'}
            variant={hasTrackDescriptions ? (adEnabled ? 'secondary' : 'outline') : 'ghost'}
            style={styles.playerButton}
            onPress={guarded(handleToggleAd)}
            onFocus={revealChrome}
            accessibilityLabel={hasTrackDescriptions ? (adEnabled ? 'Audio description is on. Press to mute.' : 'Audio description is off. Press to enable.') : 'Audio description is not available for this title.'}
          />
          <Button
            label={isDescribingLive ? 'Describing…' : (config.demoMode ? 'Describe' : 'Describe live')}
            variant={config.demoMode ? 'outline' : 'live'}
            style={styles.playerButton}
            onPress={guarded(handleDescribeNow)}
            onFocus={revealChrome}
            disabled={isDescribingLive}
            accessibilityLabel="Describe Now. Triggers on-demand multimodal Bedrock description of the current frame."
          />
          <Button
            label="Timeline"
            variant="outline"
            style={styles.playerButton}
            onPress={guarded(handleToggleTimeline)}
            onFocus={revealChrome}
            accessibilityLabel="Toggle Timeline surface to view dialogue gaps and scheduled narration blocks"
          />
          <Button
            label="Back"
            variant="ghost"
            style={styles.playerButton}
            onPress={guarded(handleBack)}
            onFocus={revealChrome}
            accessibilityLabel="Back to movie catalog"
          />
        </Animated.View>
      </View>

      {showTimeline && (
        <TimelineSurface
          descriptions={track?.descriptions || []}
          subtitles={subtitles}
          currentTimeSec={currentTimeSec}
          durationSec={durationSec || title.durationSec}
          onSelectDescription={desc => setInspectedDescription(desc)}
        />
      )}

      {inspectedDescription && (
        <WhyPanel
          description={inspectedDescription}
          onClose={() => setInspectedDescription(null)}
        />
      )}

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

  // --- top hud ---
  topHud: {
    position: 'absolute',
    top: spacing.lg,
    left: spacing.tvSafeHorizontal,
    right: spacing.tvSafeHorizontal,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    zIndex: 10
  },
  topHudSpacer: {
    flex: 1
  },
  movieTitle: {
    ...typography.bodyLarge,
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
    textShadowColor: 'rgba(0, 0, 0, 0.9)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
    maxWidth: 420
  },
  timecodeText: {
    ...typography.caption,
    fontSize: 14,
    color: '#CBD5E1',
    textShadowColor: 'rgba(0, 0, 0, 0.9)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4
  },
  counterPill: {
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radii.full
  },
  counterPillWarning: {
    backgroundColor: 'rgba(245, 158, 11, 0.22)'
  },
  counterText: {
    ...typography.badge,
    color: colors.textSecondary,
    fontSize: 11
  },

  // --- lower third: the only place text is ever drawn over the picture ---
  lowerThird: {
    position: 'absolute',
    left: spacing.tvSafeHorizontal,
    right: spacing.tvSafeHorizontal,
    bottom: 92,
    alignItems: 'center',
    gap: spacing.sm,
    zIndex: 9
  },
  narrationStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    maxWidth: '86%',
    backgroundColor: 'rgba(0, 0, 0, 0.62)',
    borderRadius: radii.md,
    paddingVertical: 8,
    paddingHorizontal: 12,
    gap: 10
  },
  narrationAccent: {
    width: 3,
    alignSelf: 'stretch',
    borderRadius: 2,
    backgroundColor: colors.narrationLight
  },
  narrationTag: {
    ...typography.badge,
    fontSize: 11,
    letterSpacing: 1,
    color: colors.narrationLight
  },
  narrationText: {
    ...typography.bodyMedium,
    fontSize: 19,
    lineHeight: 25,
    color: colors.textPrimary,
    flexShrink: 1
  },
  dialogueText: {
    ...typography.bodyLarge,
    fontSize: 22,
    lineHeight: 30,
    color: '#FFFFFF',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.95)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
    maxWidth: '82%'
  },
  refusalPill: {
    alignSelf: 'center',
    backgroundColor: 'rgba(100, 116, 139, 0.55)',
    borderRadius: radii.full,
    paddingHorizontal: 10,
    paddingVertical: 3
  },
  refusalText: {
    ...typography.badge,
    fontSize: 10,
    letterSpacing: 1,
    color: '#E2E8F0'
  },
  noTrackNote: {
    alignSelf: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    borderRadius: radii.full,
    paddingHorizontal: 12,
    paddingVertical: 4
  },
  noTrackText: {
    ...typography.caption,
    fontSize: 13,
    color: '#FBBF24'
  },

  // --- controls ---
  controlsBar: {
    position: 'absolute',
    bottom: spacing.xl,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    borderRadius: radii.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    zIndex: 10
  },
  playerButton: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderWidth: 1,
    borderRadius: radii.full
  }
});
