import { Gap, Description } from '@narratv/contracts';

export interface PlaceDescriptionsOptions {
  wordsPerSec?: number;
  minConfidence?: number;
  guardMs?: number;
}

export interface PlaceDescriptionsResult {
  scheduled: Description[];
  skipped: Description[];
  all: Description[];
  counters: {
    totalGaps: number;
    describedCount: number;
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
      describedCount: scheduled.length,
      skippedCount: skipped.length,
      skippedByReason
    }
  };
}
