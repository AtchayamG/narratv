import { Gap, Description, SubtitleCue } from '@narratv/contracts';

export interface PlaceDescriptionsOptions {
  wordsPerSec?: number;
  minConfidence?: number;
  guardMs?: number;
  extended?: boolean;
  cues?: SubtitleCue[];
}

export interface PlaceDescriptionsResult {
  scheduled: Description[];
  skipped: Description[];
  all: Description[];
  counters: {
    totalGaps: number;
    describedCount: number;
    extendedCount?: number;
    skippedCount: number;
    skippedByReason: Record<string, number>;
  };
}

/**
 * Estimates the duration in seconds required to speak a text string at a given speech rate
 */
export function estimateNarrationDuration(text: string, wordsPerSec = 2.5): number {
  if (!text || !text.trim()) return 0;
  const wordCount = text.trim().split(/\s+/).filter(Boolean).length;
  // Base speech duration + 0.3s pause buffer
  return Math.max(1.0, Math.round(((wordCount / wordsPerSec) + 0.3) * 10) / 10);
}

/**
 * Finds the earliest safe point at or after tStart within 5 seconds.
 * A safe point is never inside a dialogue cue: the start of the matching gap,
 * or the end of the dialogue cue that blocks it.
 */
export function findEarliestSafePoint(
  tStart: number,
  cues: SubtitleCue[],
  gaps: Gap[],
  guardMs = 300
): number | null {
  const guardSec = guardMs / 1000;
  const isInsideCue = (t: number) =>
    cues.some(c => t >= c.tStart && t < c.tEnd);

  const candidates: number[] = [];

  // 1. tStart itself if outside all dialogue cues
  if (!isInsideCue(tStart)) {
    candidates.push(tStart);
  }

  // 2. Start of matching gap if >= tStart and within 5s
  for (const g of gaps) {
    if (g.tStart >= tStart && g.tStart <= tStart + 5.0) {
      if (!isInsideCue(g.tStart)) {
        candidates.push(g.tStart);
      }
    }
  }

  // 3. End of dialogue cue that blocks tStart or lies within 5s
  for (const c of cues) {
    const candidatePoint = Math.round((c.tEnd + guardSec) * 1000) / 1000;
    if (candidatePoint >= tStart && candidatePoint <= tStart + 5.0) {
      if (!isInsideCue(candidatePoint)) {
        candidates.push(candidatePoint);
      }
    }
  }

  candidates.sort((a, b) => a - b);
  return candidates.length > 0 ? candidates[0] : null;
}

/**
 * Places candidate descriptions into dialogue-free gaps or marks them as skipped with deterministic reasons
 */
export function placeDescriptions(
  gaps: Gap[],
  drafts: Description[],
  options: PlaceDescriptionsOptions = {}
): PlaceDescriptionsResult {
  const wordsPerSec = options.wordsPerSec ?? 2.5;
  const minConfidence = options.minConfidence ?? 0.6;

  const scheduled: Description[] = [];
  const skipped: Description[] = [];
  const skippedByReason: Record<string, number> = {
    'low-confidence': 0,
    'no-gap': 0,
    'too-long': 0,
    'model-invalid': 0,
    'human-rejected': 0
  };

  const occupiedGaps = new Set<string>();

  for (const draft of drafts) {
    // 1. Check human rejection
    if (draft.status === 'skipped' && draft.skipReason === 'human-rejected') {
      const skippedItem: Description = {
        ...draft,
        status: 'skipped',
        skipReason: 'human-rejected',
        placementRule: 'Rejected during human editorial review'
      };
      skipped.push(skippedItem);
      skippedByReason['human-rejected'] = (skippedByReason['human-rejected'] || 0) + 1;
      continue;
    }

    // 2. Check model output validity
    if (!draft.text || !draft.text.trim()) {
      const skippedItem: Description = {
        ...draft,
        status: 'skipped',
        skipReason: 'model-invalid',
        placementRule: 'Model produced empty or malformed description text'
      };
      skipped.push(skippedItem);
      skippedByReason['model-invalid'] = (skippedByReason['model-invalid'] || 0) + 1;
      continue;
    }

    // 3. Check confidence threshold
    if (draft.confidence < minConfidence) {
      const skippedItem: Description = {
        ...draft,
        status: 'skipped',
        skipReason: 'low-confidence',
        placementRule: `Confidence ${(draft.confidence * 100).toFixed(0)}% below required ${(minConfidence * 100).toFixed(0)}% threshold`
      };
      skipped.push(skippedItem);
      skippedByReason['low-confidence'] = (skippedByReason['low-confidence'] || 0) + 1;
      continue;
    }

    // 4. Find the best available gap that accommodates this description's timestamp
    const matchingGap = gaps.find(gap => {
      // Allow draft to match gap if it falls within the gap or slightly near the gap boundary (within ±1.5s)
      return (
        !occupiedGaps.has(gap.id) &&
        draft.tStart >= gap.tStart - 1.5 &&
        draft.tStart <= gap.tEnd
      );
    });

    if (!matchingGap) {
      if (options.extended) {
        const words = draft.text.trim().split(/\s+/).filter(Boolean).length;
        const estDuration = draft.durationSec ?? estimateNarrationDuration(draft.text, wordsPerSec);
        const safePoint = findEarliestSafePoint(draft.tStart, options.cues || [], gaps, options.guardMs ?? 300);
        if (safePoint !== null) {
          const scheduledItem: Description = {
            ...draft,
            tStart: safePoint,
            tEnd: Math.round((safePoint + estDuration) * 1000) / 1000,
            durationSec: estDuration,
            isExtended: true,
            pausePoint: safePoint,
            status: draft.status === 'verified' ? 'verified' : 'ai-draft',
            placementRule: `Extended: delivered by pause at ${safePoint.toFixed(2)}s (${words} words, ${estDuration.toFixed(1)}s)`
          };
          scheduled.push(scheduledItem);
          continue;
        }
      }

      const skippedItem: Description = {
        ...draft,
        status: 'skipped',
        skipReason: 'no-gap',
        placementRule: `No dialogue-free gap ≥ 2.5s available at ${draft.tStart.toFixed(1)}s`
      };
      skipped.push(skippedItem);
      skippedByReason['no-gap'] = (skippedByReason['no-gap'] || 0) + 1;
      continue;
    }

    // 5. Check word length and narration duration
    const words = draft.text.trim().split(/\s+/).filter(Boolean).length;
    const estDuration = draft.durationSec ?? estimateNarrationDuration(draft.text, wordsPerSec);

    if (estDuration > matchingGap.duration) {
      if (options.extended) {
        const safePoint = findEarliestSafePoint(draft.tStart, options.cues || [], gaps, options.guardMs ?? 300);
        if (safePoint !== null) {
          const scheduledItem: Description = {
            ...draft,
            tStart: safePoint,
            tEnd: Math.round((safePoint + estDuration) * 1000) / 1000,
            durationSec: estDuration,
            isExtended: true,
            pausePoint: safePoint,
            status: draft.status === 'verified' ? 'verified' : 'ai-draft',
            placementRule: `Extended: delivered by pause at ${safePoint.toFixed(2)}s (${words} words, ${estDuration.toFixed(1)}s)`
          };
          scheduled.push(scheduledItem);
          continue;
        }
      }

      const skippedItem: Description = {
        ...draft,
        status: 'skipped',
        skipReason: 'too-long',
        placementRule: `Gap ${matchingGap.tStart.toFixed(1)}–${matchingGap.tEnd.toFixed(1)}s (${matchingGap.duration.toFixed(1)}s) too short for ${words} words (${estDuration.toFixed(1)}s required)`
      };
      skipped.push(skippedItem);
      skippedByReason['too-long'] = (skippedByReason['too-long'] || 0) + 1;
      continue;
    }

    // 6. Valid placement inside the gap
    const scheduledStart = matchingGap.tStart;
    const scheduledEnd = Math.round((scheduledStart + estDuration) * 1000) / 1000;

    const scheduledItem: Description = {
      ...draft,
      tStart: scheduledStart,
      tEnd: Math.min(matchingGap.tEnd, scheduledEnd),
      durationSec: estDuration,
      status: draft.status === 'verified' ? 'verified' : 'ai-draft',
      placementRule: `Gap ${matchingGap.tStart.toFixed(1)}–${matchingGap.tEnd.toFixed(1)}s (${matchingGap.duration.toFixed(1)}s) fits ${words} words (${estDuration.toFixed(1)}s)`
    };

    occupiedGaps.add(matchingGap.id);
    scheduled.push(scheduledItem);
  }

  return {
    scheduled,
    skipped,
    all: [...scheduled, ...skipped].sort((a, b) => a.tStart - b.tStart),
    counters: {
      totalGaps: gaps.length,
      describedCount: scheduled.filter(d => !d.isExtended).length,
      extendedCount: scheduled.filter(d => d.isExtended).length,
      skippedCount: skipped.length,
      skippedByReason
    }
  };
}
