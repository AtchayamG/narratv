import { parseSrt, findGaps } from '@narratv/scheduler';
import { Gap, SubtitleCue } from '@narratv/contracts';

export interface DetectGapsInput {
  titleId: string;
  srtContent: string;
  minGapSec?: number;
  guardMs?: number;
  totalDurationSec?: number;
}

export interface DetectGapsOutput {
  titleId: string;
  cues: SubtitleCue[];
  gaps: Gap[];
  totalGaps: number;
}

/**
 * Detects dialogue-free intervals using pure @narratv/scheduler
 */
export async function handler(input: DetectGapsInput): Promise<DetectGapsOutput> {
  const cues = parseSrt(input.srtContent);
  const gaps = findGaps(cues, {
    minGapSec: input.minGapSec ?? 2.5,
    guardMs: input.guardMs ?? 300,
    totalDurationSec: input.totalDurationSec
  });

  return {
    titleId: input.titleId,
    cues,
    gaps,
    totalGaps: gaps.length
  };
}
