import { mockClient } from 'aws-sdk-client-mock';
import {
  BedrockRuntimeClient,
  InvokeModelCommand
} from '@aws-sdk/client-bedrock-runtime';
import {
  PollyClient,
  SynthesizeSpeechCommand
} from '@aws-sdk/client-polly';
import {
  LiveDescribeAdapter,
  NOVA_SYSTEM_PROMPT
} from '../src/live-describe-adapter';

describe('LiveDescribeAdapter Unit Tests (aws-sdk-client-mock)', () => {
  const bedrockMock = mockClient(BedrockRuntimeClient);
  const pollyMock = mockClient(PollyClient);

  beforeEach(() => {
    bedrockMock.reset();
    pollyMock.reset();
  });

  test('calls Bedrock InvokeModel with amazon.nova-pro-v1:0, us-east-1, frame bytes and subtitle context', async () => {
    const mockNovaOutput = {
      output: {
        message: {
          content: [
            {
              text: JSON.stringify({
                text: 'Sintel scales the icy ridge against the blowing gale.',
                confidence: 0.96
              })
            }
          ]
        }
      }
    };

    bedrockMock.on(InvokeModelCommand).resolves({
      body: new TextEncoder().encode(JSON.stringify(mockNovaOutput)) as any
    });

    pollyMock.on(SynthesizeSpeechCommand).resolves({
      AudioStream: [Buffer.from('mock-audio-bytes')] as any
    });

    const adapter = new LiveDescribeAdapter({
      demoMode: false,
      region: 'us-east-1',
      modelId: 'amazon.nova-pro-v1:0',
      bedrockClient: new BedrockRuntimeClient({ region: 'us-east-1' }),
      pollyClient: new PollyClient({ region: 'us-east-1' })
    });

    const result = await adapter.describeAndSynthesize({
      titleId: 'sintel',
      timestampSec: 24.5,
      gapDurationSec: 5.2,
      frameBase64: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      subtitleContext: ['This blade has a dark past.', 'It has shed much innocent blood.'],
      previousDescription: 'A lone traveler walks along the snowy mountain path.'
    });

    // 1. Verify Bedrock request shape
    expect(bedrockMock.calls()).toHaveLength(1);
    const bedrockCall = bedrockMock.call(0);
    const invokeInput = bedrockCall.args[0].input as any;

    expect(invokeInput.modelId).toBe('amazon.nova-pro-v1:0');
    expect(invokeInput.contentType).toBe('application/json');
    expect(invokeInput.accept).toBe('application/json');

    const sentPayload = JSON.parse(invokeInput.body as string);
    expect(sentPayload.system[0].text).toBe(NOVA_SYSTEM_PROMPT);
    expect(sentPayload.messages).toHaveLength(1);
    expect(sentPayload.messages[0].role).toBe('user');

    // Verify user message contents: text with timestamp, subtitle context, and image
    const content = sentPayload.messages[0].content;
    const textBlocks = content.filter((c: any) => c.text);
    const imageBlock = content.find((c: any) => c.image);

    expect(textBlocks.some((b: any) => b.text.includes('timestamp 24.5s'))).toBe(true);
    expect(textBlocks.some((b: any) => b.text.includes('This blade has a dark past.'))).toBe(true);
    expect(textBlocks.some((b: any) => b.text.includes('A lone traveler walks'))).toBe(true);
    expect(imageBlock).toBeDefined();
    expect(imageBlock.image.format).toBe('jpeg');

    // 2. Verify Polly request shape
    expect(pollyMock.calls()).toHaveLength(1);
    const pollyCall = pollyMock.call(0);
    const pollyInput = pollyCall.args[0].input as any;

    expect(pollyInput.VoiceId).toBe('Joanna');
    expect(pollyInput.Engine).toBe('neural');
    expect(pollyInput.OutputFormat).toBe('mp3');
    expect(pollyInput.Text).toBe('Sintel scales the icy ridge against the blowing gale.');

    // 3. Verify Description result shape
    expect(result.description.text).toBe('Sintel scales the icy ridge against the blowing gale.');
    expect(result.description.confidence).toBe(0.96);
    expect(result.description.status).toBe('ai-draft');
    expect(result.description.model).toBe('amazon.nova-pro-v1:0');
    expect(result.model).toBe('amazon.nova-pro-v1:0');
    expect(result.region).toBe('us-east-1');
    expect(result.audioBuffer).toBeDefined();
  });

  test('DEMO mode NEVER calls Bedrock or Polly SDK', async () => {
    const adapter = new LiveDescribeAdapter({
      demoMode: true,
      region: 'us-east-1',
      modelId: 'amazon.nova-pro-v1:0',
      bedrockClient: new BedrockRuntimeClient({ region: 'us-east-1' }),
      pollyClient: new PollyClient({ region: 'us-east-1' })
    });

    await expect(
      adapter.describeAndSynthesize({
        titleId: 'sintel',
        timestampSec: 10.0
      })
    ).rejects.toThrow('DEMO_MODE active: Live AWS calls are disabled. Running in DEMO mode.');

    // Crucial check: zero calls made
    expect(bedrockMock.calls()).toHaveLength(0);
    expect(pollyMock.calls()).toHaveLength(0);
  });

  test('fails loudly when Bedrock credentials or network fails without fallback', async () => {
    bedrockMock.on(InvokeModelCommand).rejects(new Error('UnrecognizedClientException: The security token included in the request is invalid'));

    const adapter = new LiveDescribeAdapter({
      demoMode: false,
      region: 'us-east-1',
      modelId: 'amazon.nova-pro-v1:0',
      bedrockClient: new BedrockRuntimeClient({ region: 'us-east-1' }),
      pollyClient: new PollyClient({ region: 'us-east-1' })
    });

    await expect(
      adapter.describeAndSynthesize({
        titleId: 'sintel',
        timestampSec: 10.0
      })
    ).rejects.toThrow('LIVE unavailable: Bedrock InvokeModel (amazon.nova-pro-v1:0, us-east-1) failed: UnrecognizedClientException');

    expect(pollyMock.calls()).toHaveLength(0);
  });

  test('fails loudly when Bedrock returns invalid non-JSON output', async () => {
    const mockInvalidOutput = {
      output: {
        message: {
          content: [
            {
              text: 'Sorry, I cannot generate audio descriptions at this time.'
            }
          ]
        }
      }
    };

    bedrockMock.on(InvokeModelCommand).resolves({
      body: new TextEncoder().encode(JSON.stringify(mockInvalidOutput)) as any
    });

    const adapter = new LiveDescribeAdapter({
      demoMode: false,
      region: 'us-east-1',
      modelId: 'amazon.nova-pro-v1:0',
      bedrockClient: new BedrockRuntimeClient({ region: 'us-east-1' }),
      pollyClient: new PollyClient({ region: 'us-east-1' })
    });

    await expect(
      adapter.describeAndSynthesize({
        titleId: 'sintel',
        timestampSec: 10.0
      })
    ).rejects.toThrow('Bedrock output did not contain valid JSON');
  });

  test('fails loudly when Polly synthesis fails', async () => {
    const mockNovaOutput = {
      output: {
        message: {
          content: [
            {
              text: JSON.stringify({
                text: 'Sintel clutches the dragon child.',
                confidence: 0.91
              })
            }
          ]
        }
      }
    };

    bedrockMock.on(InvokeModelCommand).resolves({
      body: new TextEncoder().encode(JSON.stringify(mockNovaOutput)) as any
    });

    pollyMock.on(SynthesizeSpeechCommand).rejects(new Error('ServiceUnavailable: Amazon Polly is currently unavailable'));

    const adapter = new LiveDescribeAdapter({
      demoMode: false,
      region: 'us-east-1',
      modelId: 'amazon.nova-pro-v1:0',
      bedrockClient: new BedrockRuntimeClient({ region: 'us-east-1' }),
      pollyClient: new PollyClient({ region: 'us-east-1' })
    });

    await expect(
      adapter.describeAndSynthesize({
        titleId: 'sintel',
        timestampSec: 10.0
      })
    ).rejects.toThrow('LIVE unavailable: Polly SynthesizeSpeech (Joanna, us-east-1) failed');
  });
});
