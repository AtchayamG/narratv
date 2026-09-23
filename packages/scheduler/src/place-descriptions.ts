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
 * How late an extended description may be delivered, measured from the moment
 * it was written for (its tStart). Beyond this the picture has moved on and the
 * line would describe a frame the viewer is no longer looking at.
 */
export const MAX_EXTENDED_DELAY_SEC = 5.0;

/**
 * Finds the earliest safe point at or after tStart, no more than
 * MAX_EXTENDED_DELAY_SEC later, at which the film may be paused to speak.
 *
 * A point is safe only if it is outside every dialogue cue AND no cue begins
 * within the guard after it - the player samples the clock in steps, so a pause
 * aimed a few milliseconds before a line would otherwise land inside it and
 * freeze an actor mid-sentence. The guard is the same 300 ms findGaps uses.
 *
 * The description's own tStart comes first. When it is clear, the right answer
 * is to pause right there and speak over the exact frame the line was written
 * for - zero seconds late. Only when tStart itself is inside, or crowding, a
 * line of dialogue does the safe point move to the end of that dialogue.
 */
export function findEarliestSafePoint(
  tStart: number,
  cues: SubtitleCue[],
  gaps: Gap[],
  guardMs = 300
): number | null {
  const guardSec = guardMs / 1000;
  const isClear = (t: number) =>
    !cues.some(c => t >= c.tStart - guardSec && t < c.tEnd);
  const inWindow = (t: number) => t >= tStart && t <= tStart + MAX_EXTENDED_DELAY_SEC;

  const candidates: number[] = [];

  // 1. tStart itself.
  if (isClear(tStart)) candidates.push(tStart);

  // 2. The start of a later gap.
  for (const g of gaps) {
    if (inWindow(g.tStart) && isClear(g.tStart)) candidates.push(g.tStart);
  }

  // 3. The end of a line of dialogue, plus the guard.
  for (const c of cues) {
    const t = Math.round((c.tEnd + guardSec) * 1000) / 1000;
    if (inWindow(t) && isClear(t)) candidates.push(t);
  }

  candidates.sort((a, b) => a - b);
  return candidates.length > 0 ? candidates[0] : null;
}

export interface ValidatePreplacedOptions {
  extended?: boolean;
  minConfidence?: number;
  guardMs?: number;
}

/**
 * Validates a PRE-PLACED track - one whose timings are the deliverable, each
 * line written against the frame at that exact timestamp - against the real
 * dialogue. A pre-placed line is never moved. One that overlaps dialogue is:
 *
 *  - extended OFF: refused, loudly, exactly as before extended mode existed;
 *  - extended ON:  delivered by pausing the film at the earliest safe point,
 *                  if there is one within MAX_EXTENDED_DELAY_SEC, and refused
 *                  with its reason if there is not.
 *
 * Extended mode never bypasses a quality gate: a human-rejected or
 * low-confidence line stays skipped.
 *
 * This lives here, beside findEarliestSafePoint, rather than inline in the
 * track repository, because the repository used to carry its own copy of the
 * rule and the copy measured the 5 s limit from the wrong end.
 */
export function validatePreplaced(
  drafts: Description[],
  cues: SubtitleCue[],
  gaps: Gap[],
  options: ValidatePreplacedOptions = {}
): Description[] {
  const minConfidence = options.minConfidence ?? 0.6;
  const guardMs = options.guardMs ?? 300;
  const collides = (d: Description) => cues.some(c => d.tStart < c.tEnd && d.tEnd > c.tStart);

  return drafts.map(d => {
    if (!collides(d)) return d;

    const refused: Description = {
      ...d,
      status: 'skipped',
      skipReason: 'no-gap',
      placementRule: 'Refused: overlaps a real dialogue cue.'
    };
    if (!options.extended) return refused;

    if (d.status === 'skipped' && d.skipReason === 'human-rejected') return d;
    if (d.confidence < minConfidence) {
      return {
        ...d,
        status: 'skipped',
        skipReason: 'low-confidence',
        placementRule: `Confidence ${(d.confidence * 100).toFixed(0)}% below required ${(minConfidence * 100).toFixed(0)}% threshold`
      };
    }

    const safePoint = findEarliestSafePoint(d.tStart, cues, gaps, guardMs);
    if (safePoint === null) {
      return {
        ...refused,
        placementRule: `Refused: overlaps a real dialogue cue, and no safe pause point exists within ${MAX_EXTENDED_DELAY_SEC.toFixed(1)} s of ${d.tStart.toFixed(2)}s.`
      };
    }

    const late = Math.round((safePoint - d.tStart) * 100) / 100;
    return {
      ...d,
      isExtended: true,
      pausePoint: safePoint,
      placementRule:
        late === 0
          ? `Extended: film pauses at ${safePoint.toFixed(2)}s, the frame this line was written for, and resumes when it has been spoken.`
          : `Extended: film pauses at ${safePoint.toFixed(2)}s (${late.toFixed(2)} s after its frame, when the dialogue ends) and resumes when it has been spoken.`
    };
  });
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
