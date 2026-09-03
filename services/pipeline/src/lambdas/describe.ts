import { BedrockRuntimeClient, ConverseCommand } from '@aws-sdk/client-bedrock-runtime';
import { z } from 'zod';
import { Description } from '@narratv/contracts';

const OutputSchema = z.object({
  text: z.string().min(1),
  confidence: z.number().min(0).max(1)
});

export interface DescribeInput {
  titleId: string;
  gapId: string;
  timestampSec: number;
  gapDurationSec: number;
  frameBase64?: string;
  frameS3Key?: string;
  previousDescription?: string;
  modelId?: string;
}

export const SYSTEM_PROMPT = `You are a professional Audio Description (AD) narrator for blind and low-vision film audiences.
Your job is to describe the key visual actions, character expressions, and important scene elements in concise, present-tense English.
Rules:
1. Maximum 18 words.
2. Never repeat dialogue or guess character names unless obvious.
3. Be clear, objective, and vivid.
4. Output STRICT JSON in this format: {"text": "Description text here", "confidence": 0.95}`;

export class DescribeHandler {
  constructor(private readonly client: BedrockRuntimeClient) {}

  async describe(input: DescribeInput): Promise<Description> {
    const modelId = input.modelId || process.env.BEDROCK_MODEL_ID || 'amazon.nova-pro-v1:0';

    try {
      const messages: any[] = [];

      let userContent: any[] = [
        { text: `Describe the scene at timestamp ${input.timestampSec.toFixed(1)}s (gap duration: ${input.gapDurationSec.toFixed(1)}s).` }
      ];

      if (input.previousDescription) {
        userContent.push({
          text: `Previous scene context: "${input.previousDescription}". Maintain narrative continuity.`
        });
      }

      if (input.frameBase64) {
        userContent.push({
          image: {
            format: 'jpeg',
            source: {
              bytes: Buffer.from(input.frameBase64, 'base64')
            }
          }
        });
      }

      messages.push({
        role: 'user',
        content: userContent
      });

      const command = new ConverseCommand({
        modelId,
        system: [{ text: SYSTEM_PROMPT }],
        messages,
        inferenceConfig: {
          maxTokens: 120,
          temperature: 0.2
        }
      });

      const response = await this.client.send(command);
      const rawText = response.output?.message?.content?.[0]?.text || '';

      // Extract and parse JSON
      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        return {
          id: `desc-${input.gapId}`,
          tStart: input.timestampSec,
          tEnd: input.timestampSec + 3.0,
          text: '',
          confidence: 0,
          frameRef: input.frameS3Key || `frame_${input.timestampSec}.jpg`,
          model: modelId,
          status: 'skipped',
          skipReason: 'model-invalid',
          placementRule: 'Model did not return valid JSON'
        };
      }

      const parsed = JSON.parse(jsonMatch[0]);
      const validated = OutputSchema.parse(parsed);

      return {
        id: `desc-${input.gapId}`,
        tStart: input.timestampSec,
        tEnd: input.timestampSec + Math.min(input.gapDurationSec, 3.5),
        text: validated.text,
        confidence: validated.confidence,
        frameRef: input.frameS3Key || `frame_${input.timestampSec}.jpg`,
        model: modelId,
        status: validated.confidence >= 0.6 ? 'ai-draft' : 'skipped',
        skipReason: validated.confidence < 0.6 ? 'low-confidence' : undefined,
        placementRule: `Bedrock Converse (${modelId}) inference with confidence ${(validated.confidence * 100).toFixed(0)}%`
      };
    } catch (err: any) {
      return {
        id: `desc-${input.gapId}`,
        tStart: input.timestampSec,
        tEnd: input.timestampSec + 3.0,
        text: '',
        confidence: 0,
        frameRef: input.frameS3Key || `frame_${input.timestampSec}.jpg`,
        model: modelId,
        status: 'skipped',
        skipReason: 'model-invalid',
        placementRule: `Inference error: ${err.message}`
      };
    }
  }
}

export async function handler(input: DescribeInput): Promise<Description> {
  const client = new BedrockRuntimeClient({
    region: process.env.AWS_REGION || 'us-east-1'
  });
  const service = new DescribeHandler(client);
  return service.describe(input);
}
