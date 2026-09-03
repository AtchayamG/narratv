import {
  TitleSchema,
  SubtitleCueSchema,
  GapSchema,
  DescriptionSchema,
  DescriptionTrackSchema,
  HealthResponseSchema
} from '../src';

describe('Contracts Schema Validation', () => {
  test('validates valid Title', () => {
    const title = {
      id: 'sintel',
      name: 'Sintel',
      year: 2010,
      durationSec: 888,
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
      subtitleUrl: 'https://durian.blender.org/wp-content/themes/orange/subtitles/sintel_en.srt',
      posterUrl: 'https://upload.wikimedia.org/wikipedia/commons/8/8f/Sintel_poster.jpg',
      heroUrl: 'https://upload.wikimedia.org/wikipedia/commons/8/8f/Sintel_poster.jpg',
      synopsis: 'A lonely young woman, Sintel, helps and befriends a dragon child.',
      genre: 'Fantasy / Animation',
      rating: 'PG',
      license: 'CC-BY 3.0'
    };
    expect(TitleSchema.parse(title)).toEqual(title);
  });

  test('rejects invalid SubtitleCue where tEnd < tStart', () => {
    const invalidCue = {
      id: 1,
      tStart: 15.0,
      tEnd: 10.0,
      text: 'Invalid cue'
    };
    expect(() => SubtitleCueSchema.parse(invalidCue)).toThrow();
  });

  test('validates valid Gap', () => {
    const gap = {
      id: 'gap-1',
      tStart: 10.0,
      tEnd: 15.5,
      duration: 5.5,
      prevCueId: 1,
      nextCueId: 2
    };
    expect(GapSchema.parse(gap)).toEqual(gap);
  });

  test('validates Description with status and model', () => {
    const desc = {
      id: 'desc-1',
      tStart: 10.3,
      tEnd: 15.2,
      text: 'Sintel walks through a snowy mountain pass.',
      confidence: 0.92,
      frameRef: 'sintel/frame_001.png',
      model: 'amazon.nova-pro-v1:0',
      status: 'ai-draft' as const,
      placementRule: 'gap 10.0–15.5, fits 7 words'
    };
    expect(DescriptionSchema.parse(desc)).toEqual(desc);
  });

  test('validates DescriptionTrack metadata and items', () => {
    const track = {
      titleId: 'sintel',
      revision: 'v1.0.0',
      status: 'ai-draft' as const,
      descriptions: [
        {
          id: 'desc-1',
          tStart: 10.3,
          tEnd: 14.5,
          text: 'Sintel trudges through blowing snow.',
          confidence: 0.88,
          frameRef: 'sintel/frame_001.png',
          model: 'fixture',
          status: 'ai-draft' as const
        }
      ],
      metadata: {
        totalGaps: 32,
        describedCount: 28,
        skippedCount: 4,
        overlapCount: 0,
        generatedAt: '2026-09-02T12:00:00Z',
        model: 'fixture'
      }
    };
    expect(DescriptionTrackSchema.parse(track)).toEqual(track);
  });

  test('validates HealthResponse for both demo and live modes', () => {
    const demoHealth = {
      mode: 'demo' as const,
      providers: {
        bedrock: 'unconfigured' as const,
        polly: 'unconfigured' as const
      },
      revision: 'rev-abc123',
      timestamp: '2026-09-02T12:00:00Z'
    };
    expect(HealthResponseSchema.parse(demoHealth)).toEqual(demoHealth);

    const liveHealth = {
      mode: 'live' as const,
      providers: {
        bedrock: 'ok' as const,
        polly: 'ok' as const,
        s3: 'ok' as const
      },
      revision: 'rev-def456',
      timestamp: '2026-09-02T12:00:00Z'
    };
    expect(HealthResponseSchema.parse(liveHealth)).toEqual(liveHealth);
  });
});
