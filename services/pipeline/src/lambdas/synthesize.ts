import { PollyClient, SynthesizeSpeechCommand, VoiceId, Engine } from '@aws-sdk/client-polly';
import crypto from 'crypto';
import { Description } from '@narratv/contracts';

export interface SynthesizeInput {
  titleId: string;
  description: Description;
  voiceId?: VoiceId;
  engine?: Engine;
  s3BucketName?: string;
}

export interface SynthesizeOutput {
  descriptionId: string;
  s3Key: string;
  sha256Key: string;
  audioBuffer?: Buffer;
}

export class SynthesizeHandler {
  constructor(private readonly pollyClient: PollyClient) {}

  generateIdempotencyKey(text: string, voiceId: string, engine: string): string {
    return crypto.createHash('sha256').update(`${text}:${voiceId}:${engine}`).digest('hex');
  }

  async synthesize(input: SynthesizeInput): Promise<SynthesizeOutput> {
    const voiceId = input.voiceId || 'Joanna';
    const engine = input.engine || 'neural';
    const sha256Key = this.generateIdempotencyKey(input.description.text, voiceId, engine);
    const s3Key = `titles/${input.titleId}/audio/${sha256Key}.mp3`;

    if (input.description.status === 'skipped' || !input.description.text.trim()) {
      return {
        descriptionId: input.description.id,
        s3Key: '',
        sha256Key
      };
    }

    const command = new SynthesizeSpeechCommand({
      Text: input.description.text,
      VoiceId: voiceId,
      Engine: engine,
      OutputFormat: 'mp3'
    });

    const response = await this.pollyClient.send(command);

    let audioBuffer: Buffer | undefined;
    if (response.AudioStream) {
      const chunks: Uint8Array[] = [];
      for await (const chunk of response.AudioStream as any) {
        chunks.push(chunk);
      }
      audioBuffer = Buffer.concat(chunks);
    }

    return {
      descriptionId: input.description.id,
      s3Key,
      sha256Key,
      audioBuffer
    };
  }
}

export async function handler(input: SynthesizeInput): Promise<SynthesizeOutput> {
  const client = new PollyClient({
    region: process.env.AWS_REGION || 'us-east-1'
  });
  const service = new SynthesizeHandler(client);
  return service.synthesize(input);
}
