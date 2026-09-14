import { handler as detectGapsHandler } from '../src/lambdas/detect-gaps';
import { handler as extractFramesHandler } from '../src/lambdas/extract-frames';
import { DescribeHandler } from '../src/lambdas/describe';
import { SynthesizeHandler } from '../src/lambdas/synthesize';
import { PublishHandler } from '../src/lambdas/publish';
import { ApiService, normaliseRequest } from '../src/lambdas/api-handler';
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
      gapDurationSec: 5.0,
      // A frame is REQUIRED now, and this test used to omit it - which means
      // this test was itself exercising the describe-with-no-image path and
      // asserting that a model answer given nothing to look at is a valid
      // 'ai-draft'. It proved the JSON parsing worked while quietly blessing
      // the fabrication. Bytes are nonsense on purpose; the Bedrock client is
      // mocked and only the presence of a frame is under test here.
      frameBase64: Buffer.from('fake-jpeg-bytes').toString('base64')
    });

    expect(result.status).toBe('ai-draft');
    expect(result.confidence).toBe(0.94);
    expect(result.text).toBe('A dragon glides across the snowy mountain peak.');
    expect(mockBedrockClient.send).toHaveBeenCalled();

    // And the image really was attached to the Converse call.
    const sentCommand = mockBedrockClient.send.mock.calls[0][0];
    const content = sentCommand.input.messages[0].content;
    expect(content.some((part: any) => part.image)).toBe(true);
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

  describe('a description is refused when there is no frame to look at', () => {
    // Found on the deployed endpoint, not in a test. POST /describe with no
    // frameBase64 returned, for Sintel at 2.0s (snow across mountain peaks):
    //
    //   "Person opens closet door, revealing dark, empty space."
    //   confidence 0.95, frameRef "frame_2.jpg"
    //
    // A fluent invention, a high confidence score, and a provenance pointer to
    // an image that was never sent. frameRef is the field this project stakes
    // its honesty on. These tests exist so that can never come back.
    const noFrameInput = {
      gapId: 'gap-1',
      titleId: 'sintel',
      timestampSec: 2.0,
      gapDurationSec: 4.0
    };

    test('refuses instead of calling the model at all', async () => {
      const client = { send: jest.fn() } as any;
      const describer = new DescribeHandler(client);

      const result = await describer.describe(noFrameInput);

      // The model must not even be consulted - there is nothing to show it.
      expect(client.send).not.toHaveBeenCalled();
      expect(result.status).toBe('skipped');
      expect(result.skipReason).toBe('no-frame');
    });

    test('emits no text and zero confidence', async () => {
      const describer = new DescribeHandler({ send: jest.fn() } as any);
      const result = await describer.describe(noFrameInput);

      expect(result.text).toBe('');
      expect(result.confidence).toBe(0);
    });

    test('does not invent a frameRef for an image that never existed', async () => {
      const describer = new DescribeHandler({ send: jest.fn() } as any);
      const result = await describer.describe(noFrameInput);

      // The old code produced "frame_2.jpg" here, which reads exactly like a
      // real provenance pointer.
      expect(result.frameRef).not.toMatch(/frame_\d/);
      expect(result.frameRef).toMatch(/no frame/i);
    });
  });

  // Every test above hand-builds an API Gateway payload format 1.0 event
  // (`httpMethod` + `path`). The deployed stack is an HTTP API, which defaults
  // to payload format 2.0 - method at requestContext.http.method, path at
  // rawPath, and no httpMethod or path key at all. So `event.path.replace(...)`
  // threw on the first real request and every route returned HTTP 500, while
  // this suite stayed green. These tests exist so the shape that actually
  // reaches production is the shape that is covered.
  describe('accepts the event shape API Gateway really sends', () => {
    const v2Health = {
      version: '2.0',
      rawPath: '/health',
      requestContext: { http: { method: 'GET', path: '/health' } }
    };

    test('normaliseRequest reads payload format 2.0', () => {
      expect(normaliseRequest(v2Health)).toEqual({ method: 'GET', path: '/health' });
    });

    test('normaliseRequest still reads payload format 1.0', () => {
      expect(normaliseRequest({ httpMethod: 'POST', path: '/describe' })).toEqual({
        method: 'POST',
        path: '/describe'
      });
    });

    test('a trailing slash does not become a 404', () => {
      expect(normaliseRequest({ httpMethod: 'GET', path: '/health/' }).path).toBe('/health');
    });

    test('/health routes on a real HTTP API event rather than throwing', async () => {
      process.env.DEMO_MODE = 'true';
      const api = new ApiService();
      const response = await api.route(v2Health);

      // The regression was a 500 from an unhandled TypeError.
      expect(response.statusCode).toBe(200);
      expect(JSON.parse(response.body).mode).toBe('demo');
    });

    test('an unknown route reports the method it actually saw', async () => {
      const api = new ApiService();
      const response = await api.route({
        version: '2.0',
        rawPath: '/nope',
        requestContext: { http: { method: 'GET', path: '/nope' } }
      });

      expect(response.statusCode).toBe(404);
      // Previously this said "Route not found: undefined undefined".
      expect(JSON.parse(response.body).error).toBe('Route not found: GET /nope');
    });

    test('decodes a base64 body, which HTTP API can send', async () => {
      process.env.DEMO_MODE = 'true';
      const api = new ApiService();
      const response = await api.route({
        version: '2.0',
        rawPath: '/describe',
        requestContext: { http: { method: 'POST', path: '/describe' } },
        body: Buffer.from(JSON.stringify({ nonsense: true }), 'utf8').toString('base64'),
        isBase64Encoded: true
      });

      // The point is that the body was decoded and parsed at all - a garbled
      // body would fail differently (and did, silently, before this).
      expect([400, 422, 503]).toContain(response.statusCode);
    });
  });
});
