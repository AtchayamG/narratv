import { handler as detectGapsHandler } from '../src/lambdas/detect-gaps';
import { handler as extractFramesHandler } from '../src/lambdas/extract-frames';
import { DescribeHandler } from '../src/lambdas/describe';
import { SynthesizeHandler } from '../src/lambdas/synthesize';
import { PublishHandler } from '../src/lambdas/publish';
import { ApiService } from '../src/lambdas/api-handler';
import { Gap, Description, SubtitleCue } from '@narratv/contracts';

describe('Pipeline Lambda Handlers (Unit Tests with Mocked SDKs)', () => {
  test('detect-gaps handler parses SRT and detects dialogue-free gaps', async () => {
    const srt = `1\n00:00:10,000 --> 00:00:14,000\nHello\n\n2\n00:00:20,000 --> 00:00:24,000\nWorld`;
    const result = await detectGapsHandler({
      titleId: 'test-title',
      srtContent: srt,
      minGapSec: 2.5,
      guardMs: 300
    });

    expect(result.titleId).toBe('test-title');
    expect(result.cues).toHaveLength(2);
    // Initial gap: 0 to 9.7s; intermediate gap: 14.3 to 19.7s (5.4s)
    expect(result.gaps.length).toBeGreaterThanOrEqual(2);
  });

  test('extract-frames handler computes midpoint sample timestamps', async () => {
    const gaps: Gap[] = [
      { id: 'gap-1', tStart: 10.0, tEnd: 16.0, duration: 6.0 }
    ];
    const result = await extractFramesHandler({
      titleId: 'sintel',
      videoS3Key: 'videos/sintel.mp4',
      gaps
    });

    expect(result.frames).toHaveLength(1);
    expect(result.frames[0].timestampSec).toBe(13.0);
    expect(result.frames[0].frameS3Key).toContain('frame_gap-1_13.0.jpg');
  });

  test('describe handler parses JSON response from Bedrock Converse', async () => {
    const mockBedrockClient: any = {
      send: jest.fn().mockResolvedValue({
        output: {
          message: {
            content: [
              { text: '{"text": "A dragon glides across the snowy mountain peak.", "confidence": 0.94}' }
            ]
          }
        }
      })
    };

    const describer = new DescribeHandler(mockBedrockClient);
    const result = await describer.describe({
      titleId: 'sintel',
      gapId: 'gap-1',
      timestampSec: 12.0,
      gapDurationSec: 5.0
    });

    expect(result.status).toBe('ai-draft');
    expect(result.confidence).toBe(0.94);
    expect(result.text).toBe('A dragon glides across the snowy mountain peak.');
    expect(mockBedrockClient.send).toHaveBeenCalled();
  });

  test('synthesize handler computes idempotent sha256 cache key and calls Polly', async () => {
    const mockPollyClient: any = {
      send: jest.fn().mockResolvedValue({
        AudioStream: [Buffer.from('mock-mp3-audio-bytes')]
      })
    };

    const desc: Description = {
      id: 'desc-1',
      tStart: 5.0,
      tEnd: 8.0,
      text: 'Sintel looks into the cavern.',
      confidence: 0.9,
      frameRef: 'f1.jpg',
      model: 'amazon.nova-pro-v1:0',
      status: 'ai-draft'
    };

    const synthesizer = new SynthesizeHandler(mockPollyClient);
    const result = await synthesizer.synthesize({
      titleId: 'sintel',
      description: desc,
      voiceId: 'Joanna',
      engine: 'neural'
    });

    expect(result.descriptionId).toBe('desc-1');
    expect(result.sha256Key).toHaveLength(64);
    expect(result.s3Key).toContain(`${result.sha256Key}.mp3`);
    expect(mockPollyClient.send).toHaveBeenCalled();
  });

  test('publish handler audits 0 overlaps and packages DescriptionTrack', async () => {
    const cues: SubtitleCue[] = [
      { id: 1, tStart: 10.0, tEnd: 15.0, text: 'Dialogue' }
    ];
    const gaps: Gap[] = [
      { id: 'g0', tStart: 0, tEnd: 9.7, duration: 9.7 }
    ];
    const descriptions: Description[] = [
      {
        id: 'd1',
        tStart: 0,
        tEnd: 4.0,
        text: 'Action in opening gap.',
        confidence: 0.92,
        frameRef: 'f0.jpg',
        model: 'amazon.nova-pro-v1:0',
        status: 'ai-draft'
      }
    ];

    const publisher = new PublishHandler();
    const result = await publisher.publish({
      titleId: 'sintel',
      descriptions,
      gaps,
      cues,
      cloudFrontDomain: 'd123.cloudfront.net'
    });

    expect(result.metadata.overlapCount).toBe(0);
    expect(result.metadata.describedCount).toBe(1);
    expect(result.trackS3Key).toBe('titles/sintel/track.json');
    expect(result.trackUrl).toBe('https://d123.cloudfront.net/titles/sintel/track.json');
  });

  test('api-handler /health returns 503 explicitly when AWS credentials unconfigured in LIVE mode', async () => {
    delete process.env.AWS_REGION;
    delete process.env.AWS_DEFAULT_REGION;
    process.env.DEMO_MODE = 'false';

    const api = new ApiService();
    const response = await api.route({
      httpMethod: 'GET',
      path: '/health'
    });

    expect(response.statusCode).toBe(503);
    const body = JSON.parse(response.body);
    expect(body.error).toContain('Service Unavailable');
    expect(body.mode).toBe('live');
  });

  test('api-handler /health returns 200 with demo mode when DEMO_MODE=true', async () => {
    process.env.DEMO_MODE = 'true';

    const api = new ApiService();
    const response = await api.route({
      httpMethod: 'GET',
      path: '/health'
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.mode).toBe('demo');
    expect(body.revision).toBeDefined();
  });
});
