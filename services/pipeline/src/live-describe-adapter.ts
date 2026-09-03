import {
  BedrockRuntimeClient,
  InvokeModelCommand
} from '@aws-sdk/client-bedrock-runtime';
import {
  PollyClient,
  SynthesizeSpeechCommand,
  VoiceId,
  Engine
} from '@aws-sdk/client-polly';
import { z } from 'zod';
import { Description, DescriptionSchema } from '@narratv/contracts';

const OutputSchema = z.object({
  text: z.string().min(1),
  confidence: z.number().min(0).max(1)
});

export const NOVA_SYSTEM_PROMPT = `You are a professional Audio Description (AD) narrator for blind and low-vision film audiences.
Your job is to describe the key visual actions, character expressions, and important scene elements in concise, present-tense English.
Rules:
1. Maximum 18 words.
2. Never repeat dialogue or guess character names unless obvious.
3. Be clear, objective, and vivid.
4. Output STRICT JSON in this format: {"text": "Description text here", "confidence": 0.95}`;

export interface LiveDescribeInput {
  titleId: string;
  timestampSec: number;
  gapDurationSec?: number;
  frameBase64?: string;
  subtitleContext?: string | string[];
  previousDescription?: string;
  voiceId?: VoiceId;
  engine?: Engine;
}

export interface LiveDescribeResult {
  description: Description;
  audioBuffer?: Buffer;
  audioS3Key?: string;
  model: string;
  region: string;
  latencyMs: number;
}

export interface LiveDescribeAdapterOptions {
  demoMode?: boolean;
  region?: string;
  modelId?: string;
  bedrockClient?: BedrockRuntimeClient;
  pollyClient?: PollyClient;
}

export class LiveDescribeAdapter {
  private readonly region: string;
  private readonly modelId: string;
  private readonly demoMode: boolean;
  private readonly bedrockClient: BedrockRuntimeClient;
  private readonly pollyClient: PollyClient;

  constructor(options?: LiveDescribeAdapterOptions) {
    this.demoMode = options?.demoMode ?? (process.env.DEMO_MODE === 'true');
    this.region = options?.region ?? process.env.AWS_REGION ?? 'us-east-1';
    this.modelId = options?.modelId ?? process.env.BEDROCK_MODEL_ID ?? 'amazon.nova-pro-v1:0';

    // AWS SDK clients resolve credentials from standard AWS credential provider chain / env
    this.bedrockClient = options?.bedrockClient ?? new BedrockRuntimeClient({ region: this.region });
    this.pollyClient = options?.pollyClient ?? new PollyClient({ region: this.region });
  }

  async describeAndSynthesize(input: LiveDescribeInput): Promise<LiveDescribeResult> {
    // In DEMO mode, never make live calls to AWS SDK
    if (this.demoMode) {
      throw new Error('DEMO_MODE active: Live AWS calls are disabled. Running in DEMO mode.');
    }

    const startTime = Date.now();
    const gapDuration = input.gapDurationSec ?? 4.0;

    // 1. Construct Amazon Nova Pro multimodal prompt
    const userContent: any[] = [
      {
        text: `Describe the scene at timestamp ${input.timestampSec.toFixed(1)}s (available dialogue gap: ${gapDuration.toFixed(1)}s).`
      }
    ];

    if (input.subtitleContext) {
      const contextText = Array.isArray(input.subtitleContext)
        ? input.subtitleContext.join(' | ')
        : input.subtitleContext;
      userContent.push({
        text: `Surrounding dialogue/subtitle context (do not repeat this text): "${contextText}"`
      });
    }

    if (input.previousDescription) {
      userContent.push({
        text: `Previous scene description: "${input.previousDescription}". Maintain narrative flow.`
      });
    }

    if (input.frameBase64) {
      userContent.push({
        image: {
          format: 'jpeg',
          source: {
            bytes: input.frameBase64
          }
        }
      });
    }

    const novaPayload = {
      system: [{ text: NOVA_SYSTEM_PROMPT }],
      messages: [
        {
          role: 'user',
          content: userContent
        }
      ],
      inferenceConfig: {
        maxTokens: 120,
        temperature: 0.2
      }
    };

    // 2. Call Bedrock Runtime with InvokeModelCommand
    let descriptionText = '';
    let confidence = 0;
    try {
      const invokeCommand = new InvokeModelCommand({
        modelId: this.modelId,
        contentType: 'application/json',
        accept: 'application/json',
        body: JSON.stringify(novaPayload)
      });

      const bedrockResponse = await this.bedrockClient.send(invokeCommand);
      const responseBody = JSON.parse(new TextDecoder().decode(bedrockResponse.body));

      const rawText = responseBody.output?.message?.content?.[0]?.text || '';
      const jsonMatch = rawText.match(/\{[\s\S]*\}/);

      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        const validated = OutputSchema.parse(parsed);
        descriptionText = validated.text;
        confidence = validated.confidence;
      } else {
        throw new Error(`Bedrock output did not contain valid JSON: ${rawText}`);
      }
    } catch (err: any) {
      throw new Error(`LIVE unavailable: Bedrock InvokeModel (${this.modelId}, ${this.region}) failed: ${err.message}`);
    }

    // 3. Build Description record
    const description: Description = DescriptionSchema.parse({
      id: `live-${input.titleId}-${Math.round(input.timestampSec * 1000)}`,
      tStart: input.timestampSec,
      tEnd: input.timestampSec + Math.min(gapDuration, 3.5),
      text: descriptionText,
      confidence,
      frameRef: `live/${input.titleId}_${input.timestampSec.toFixed(1)}.jpg`,
      model: this.modelId,
      status: confidence >= 0.6 ? 'ai-draft' : 'skipped',
      skipReason: confidence < 0.6 ? 'low-confidence' : undefined,
      placementRule: `Live Bedrock InvokeModel (${this.modelId}) confidence ${(confidence * 100).toFixed(0)}%`
    });

    // 4. Synthesize speech audio using Amazon Polly SynthesizeSpeechCommand
    let audioBuffer: Buffer | undefined;
    if (description.status !== 'skipped' && description.text.trim()) {
      try {
        const pollyCommand = new SynthesizeSpeechCommand({
          Text: description.text,
          VoiceId: input.voiceId ?? 'Joanna',
          Engine: input.engine ?? 'neural',
          OutputFormat: 'mp3'
        });

        const pollyResponse = await this.pollyClient.send(pollyCommand);
        if (pollyResponse.AudioStream) {
          const chunks: Uint8Array[] = [];
          for await (const chunk of pollyResponse.AudioStream as any) {
            chunks.push(chunk);
          }
          audioBuffer = Buffer.concat(chunks);
        }
      } catch (err: any) {
        throw new Error(`LIVE unavailable: Polly SynthesizeSpeech (${input.voiceId ?? 'Joanna'}, ${this.region}) failed: ${err.message}`);
      }
    }

    const latencyMs = Date.now() - startTime;

    return {
      description,
      audioBuffer,
      audioS3Key: audioBuffer ? `audio/live/${description.id}.mp3` : undefined,
      model: this.modelId,
      region: this.region,
      latencyMs
    };
  }
}
