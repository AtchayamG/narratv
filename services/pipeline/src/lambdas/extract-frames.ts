import { Gap } from '@narratv/contracts';

export interface ExtractFramesInput {
  titleId: string;
  videoS3Key: string;
  gaps: Gap[];
}

export interface ExtractedFrame {
  gapId: string;
  timestampSec: number;
  frameS3Key: string;
}

export interface ExtractFramesOutput {
  titleId: string;
  frames: ExtractedFrame[];
}

/**
 * Computes midpoint sample timestamps for dialogue-free gaps and targets frame extraction keys
 */
export async function handler(input: ExtractFramesInput): Promise<ExtractFramesOutput> {
  const frames: ExtractedFrame[] = input.gaps.map(gap => {
    // Sample frame at gap midpoint
    const midpoint = Math.round(((gap.tStart + gap.tEnd) / 2) * 100) / 100;
    return {
      gapId: gap.id,
      timestampSec: midpoint,
      frameS3Key: `titles/${input.titleId}/frames/frame_${gap.id}_${midpoint.toFixed(1)}.jpg`
    };
  });

  return {
    titleId: input.titleId,
    frames
  };
}
