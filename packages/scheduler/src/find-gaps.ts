import { SubtitleCue, Gap } from '@narratv/contracts';

export interface FindGapsOptions {
  minGapSec?: number;
  guardMs?: number;
  totalDurationSec?: number;
}

/**
 * Merges overlapping or adjacent subtitle cues into non-overlapping busy intervals
 */
export function mergeSubtitleIntervals(cues: SubtitleCue[]): { tStart: number; tEnd: number }[] {
  if (cues.length === 0) return [];

  const sorted = [...cues].sort((a, b) => a.tStart - b.tStart);
  const merged: { tStart: number; tEnd: number }[] = [];

  let current = { tStart: sorted[0].tStart, tEnd: sorted[0].tEnd };

  for (let i = 1; i < sorted.length; i++) {
    const next = sorted[i];
    if (next.tStart <= current.tEnd) {
      current.tEnd = Math.max(current.tEnd, next.tEnd);
    } else {
      merged.push(current);
      current = { tStart: next.tStart, tEnd: next.tEnd };
    }
  }
  merged.push(current);

  return merged;
}

/**
 * Finds all dialogue-free gaps between subtitle cues that are >= minGapSec with guard bands applied
 */
export function findGaps(
  cues: SubtitleCue[],
  options: FindGapsOptions = {}
): Gap[] {
  const minGapSec = options.minGapSec ?? 2.5;
  const guardMs = options.guardMs ?? 300;
  const guardSec = guardMs / 1000;
  const totalDurationSec = options.totalDurationSec;

  const gaps: Gap[] = [];
  const mergedCues = mergeSubtitleIntervals(cues);

  if (mergedCues.length === 0) {
    if (totalDurationSec && totalDurationSec >= minGapSec) {
      gaps.push({
        id: 'gap-0',
        tStart: 0,
        tEnd: totalDurationSec,
        duration: totalDurationSec
      });
    }
    return gaps;
  }

  // 1. Initial gap before the first dialogue cue
  const firstCue = mergedCues[0];
  const initialGapEnd = Math.max(0, firstCue.tStart - guardSec);
  if (initialGapEnd >= minGapSec) {
    gaps.push({
      id: 'gap-0',
      tStart: 0,
      tEnd: Math.round(initialGapEnd * 1000) / 1000,
      duration: Math.round(initialGapEnd * 1000) / 1000,
      nextCueId: cues[0]?.id
    });
  }

  // 2. Gaps between consecutive dialogue cues
  for (let i = 0; i < mergedCues.length - 1; i++) {
    const current = mergedCues[i];
    const next = mergedCues[i + 1];

    const gapStart = Math.round((current.tEnd + guardSec) * 1000) / 1000;
    const gapEnd = Math.round((next.tStart - guardSec) * 1000) / 1000;
    const duration = Math.round((gapEnd - gapStart) * 1000) / 1000;

    if (gapEnd > gapStart && duration >= minGapSec) {
      gaps.push({
        id: `gap-${gaps.length}`,
        tStart: gapStart,
        tEnd: gapEnd,
        duration,
        prevCueId: cues[i]?.id,
        nextCueId: cues[i + 1]?.id
      });
    }
  }

  // 3. Final gap after the last dialogue cue
  const lastCue = mergedCues[mergedCues.length - 1];
  if (totalDurationSec !== undefined) {
    const finalGapStart = Math.round((lastCue.tEnd + guardSec) * 1000) / 1000;
    const finalGapEnd = Math.round(totalDurationSec * 1000) / 1000;
    const duration = Math.round((finalGapEnd - finalGapStart) * 1000) / 1000;

    if (finalGapEnd > finalGapStart && duration >= minGapSec) {
      gaps.push({
        id: `gap-${gaps.length}`,
        tStart: finalGapStart,
        tEnd: finalGapEnd,
        duration,
        prevCueId: cues[cues.length - 1]?.id
      });
    }
  }

  return gaps;
}
