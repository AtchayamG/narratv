import { Description, SubtitleCue, Gap } from '@narratv/contracts';

export interface OverlapDetail {
  descriptionId: string;
  descriptionText: string;
  descriptionInterval: [number, number];
  cueId: string | number;
  cueText: string;
  cueInterval: [number, number];
}

export interface OverlapAnalysisResult {
  overlapCount: number;
  overlaps: OverlapDetail[];
}

/**
 * Computes exact collisions/overlaps between scheduled descriptions and dialogue subtitle cues
 */
export function computeOverlaps(
  descriptions: Description[],
  cues: SubtitleCue[]
): OverlapAnalysisResult {
  const overlaps: OverlapDetail[] = [];

  // Only check scheduled/active descriptions (not skipped items)
  const activeDescriptions = descriptions.filter(d => d.status !== 'skipped');

  for (const desc of activeDescriptions) {
    if (desc.isExtended) {
      // Extended descriptions pause playback at pausePoint.
      // An overlap occurs only if the pausePoint itself lies inside a dialogue cue.
      for (const cue of cues) {
        if (
          desc.pausePoint !== undefined &&
          desc.pausePoint >= cue.tStart &&
          desc.pausePoint < cue.tEnd
        ) {
          overlaps.push({
            descriptionId: desc.id,
            descriptionText: desc.text,
            descriptionInterval: [desc.tStart, desc.tEnd],
            cueId: cue.id,
            cueText: cue.text,
            cueInterval: [cue.tStart, cue.tEnd]
          });
        }
      }
      continue;
    }

    for (const cue of cues) {
      // Overlap condition: intervals [desc.tStart, desc.tEnd] and [cue.tStart, cue.tEnd] intersect
      // Intersection exists if desc.tStart < cue.tEnd and desc.tEnd > cue.tStart
      if (desc.tStart < cue.tEnd && desc.tEnd > cue.tStart) {
        overlaps.push({
          descriptionId: desc.id,
          descriptionText: desc.text,
          descriptionInterval: [desc.tStart, desc.tEnd],
          cueId: cue.id,
          cueText: cue.text,
          cueInterval: [cue.tStart, cue.tEnd]
        });
      }
    }
  }

  return {
    overlapCount: overlaps.length,
    overlaps
  };
}

export interface TrackCounters {
  totalGaps: number;
  describedCount: number;
  extendedCount: number;
  skippedCount: number;
  overlapCount: number;
  skippedByReason: Record<string, number>;
}

/**
 * Computes comprehensive audit metrics and counters for a title's description track
 */
export function computeTrackCounters(
  descriptions: Description[],
  gaps: Gap[],
  cues: SubtitleCue[]
): TrackCounters {
  const active = descriptions.filter(d => d.status !== 'skipped');
  const normal = active.filter(d => !d.isExtended);
  const extended = active.filter(d => d.isExtended);
  const skipped = descriptions.filter(d => d.status === 'skipped');

  const skippedByReason: Record<string, number> = {
    'low-confidence': 0,
    'no-gap': 0,
    'too-long': 0,
    'model-invalid': 0,
    'human-rejected': 0
  };

  for (const item of skipped) {
    const reason = item.skipReason || 'unknown';
    skippedByReason[reason] = (skippedByReason[reason] || 0) + 1;
  }

  const { overlapCount } = computeOverlaps(descriptions, cues);

  return {
    totalGaps: gaps.length,
    describedCount: normal.length,
    extendedCount: extended.length,
    skippedCount: skipped.length,
    overlapCount,
    skippedByReason
  };
}
