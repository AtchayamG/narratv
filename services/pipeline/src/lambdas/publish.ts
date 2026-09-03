import { Description, DescriptionTrack, Gap, SubtitleCue } from '@narratv/contracts';
import { computeTrackCounters } from '@narratv/scheduler';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

export interface PublishInput {
  titleId: string;
  descriptions: Description[];
  gaps: Gap[];
  cues: SubtitleCue[];
  s3BucketName?: string;
  cloudFrontDomain?: string;
  revision?: string;
}

export interface PublishOutput {
  titleId: string;
  trackS3Key: string;
  trackUrl?: string;
  metadata: {
    totalGaps: number;
    describedCount: number;
    skippedCount: number;
    overlapCount: number;
  };
}

export class PublishHandler {
  constructor(private readonly s3Client?: S3Client) {}

  async publish(input: PublishInput): Promise<PublishOutput> {
    const counters = computeTrackCounters(input.descriptions, input.gaps, input.cues);
    const revision = input.revision || `rev-${Date.now()}`;

    const enrichedDescriptions = input.descriptions.map(desc => {
      if (input.cloudFrontDomain && desc.audioUrl) {
        return {
          ...desc,
          audioUrl: `https://${input.cloudFrontDomain}/${desc.audioUrl.replace(/^\//, '')}`
        };
      }
      return desc;
    });

    const track: DescriptionTrack = {
      titleId: input.titleId,
      revision,
      status: enrichedDescriptions.some(d => d.status === 'verified') ? 'mixed' : 'ai-draft',
      descriptions: enrichedDescriptions,
      metadata: {
        totalGaps: counters.totalGaps,
        describedCount: counters.describedCount,
        skippedCount: counters.skippedCount,
        overlapCount: counters.overlapCount,
        generatedAt: new Date().toISOString(),
        model: process.env.BEDROCK_MODEL_ID || 'amazon.nova-pro-v1:0'
      }
    };

    const trackS3Key = `titles/${input.titleId}/track.json`;

    if (this.s3Client && input.s3BucketName) {
      await this.s3Client.send(
        new PutObjectCommand({
          Bucket: input.s3BucketName,
          Key: trackS3Key,
          Body: JSON.stringify(track, null, 2),
          ContentType: 'application/json',
          CacheControl: 'max-age=60'
        })
      );
    }

    const trackUrl = input.cloudFrontDomain
      ? `https://${input.cloudFrontDomain}/${trackS3Key}`
      : undefined;

    return {
      titleId: input.titleId,
      trackS3Key,
      trackUrl,
      metadata: {
        totalGaps: counters.totalGaps,
        describedCount: counters.describedCount,
        skippedCount: counters.skippedCount,
        overlapCount: counters.overlapCount
      }
    };
  }
}

export async function handler(input: PublishInput): Promise<PublishOutput> {
  const client = new S3Client({
    region: process.env.AWS_REGION || 'us-east-1'
  });
  const service = new PublishHandler(client);
  return service.publish(input);
}
