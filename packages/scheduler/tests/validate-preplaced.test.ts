import { Description, SubtitleCue } from '@narratv/contracts';
import { findGaps, validatePreplaced, findEarliestSafePoint, MAX_EXTENDED_DELAY_SEC } from '../src';

/**
 * Pre-placed tracks: a line is never moved. One that overlaps dialogue is
 * refused, or - with extended mode on - delivered by pausing the film at the
 * earliest safe point within MAX_EXTENDED_DELAY_SEC of the frame it describes.
 *
 * The 5 s limit is measured from the description's own tStart. An earlier
 * version measured the length of the blocking dialogue instead, and passed
 * lines that would have been spoken 5.25 s and 7.5 s after their frame.
 */
const cue = (id: number, tStart: number, tEnd: number): SubtitleCue => ({ id, tStart, tEnd, text: `line ${id}` });
const desc = (id: string, tStart: number, tEnd: number, extra: Partial<Description> = {}): Description => ({
  id, tStart, tEnd, text: 'A figure crosses the frame.', confidence: 0.9,
  frameRef: 'f.png', model: 'fixture', status: 'verified', durationSec: tEnd - tStart, ...extra
});
const gapsFor = (cues: SubtitleCue[]) => findGaps(cues, { minGapSec: 2.5, guardMs: 300, totalDurationSec: 200 });

describe('validatePreplaced', () => {
  it('extended OFF: a line overlapping dialogue is refused exactly as before extended mode existed', () => {
    const cues = [cue(1, 12, 15)];
    const [d] = validatePreplaced([desc('a', 10, 14)], cues, gapsFor(cues), { extended: false });
    expect(d.status).toBe('skipped');
    expect(d.skipReason).toBe('no-gap');
    expect(d.placementRule).toBe('Refused: overlaps a real dialogue cue.');
    expect(d.isExtended).toBeUndefined();
    expect(d.pausePoint).toBeUndefined();
  });

  it('a line that does not overlap dialogue is returned untouched in both modes', () => {
    const cues = [cue(1, 20, 22)];
    const original = desc('a', 10, 14);
    for (const extended of [false, true]) {
      const [d] = validatePreplaced([original], cues, gapsFor(cues), { extended });
      expect(d).toEqual(original);
    }
  });

  it('extended ON, line starts in clear air: the film pauses at its own tStart - zero seconds late', () => {
    // Shape of sintel-ad-11: line at 146.8-151.78, dialogue from 148.85.
    const cues = [cue(1, 148.85, 151.75)];
    const [d] = validatePreplaced([desc('ad11', 146.8, 151.78)], cues, gapsFor(cues), { extended: true });
    expect(d.isExtended).toBe(true);
    expect(d.pausePoint).toBe(146.8);
    expect(d.status).toBe('verified');
  });

  it('extended ON, line starts inside dialogue that ends soon: pause at the end of the line plus the 300 ms guard', () => {
    const cues = [cue(1, 50, 52)];
    const [d] = validatePreplaced([desc('b', 51, 54)], cues, gapsFor(cues), { extended: true });
    expect(d.isExtended).toBe(true);
    expect(d.pausePoint).toBeCloseTo(52.3, 3);
  });

  it('extended ON, dialogue runs past the limit: refused, with the reason stated', () => {
    const cues = [cue(1, 100, 106)];
    const [d] = validatePreplaced([desc('c', 101, 104)], cues, gapsFor(cues), { extended: true });
    // Earliest clear point would be 106.3, which is 5.3 s after the frame.
    expect(d.status).toBe('skipped');
    expect(d.skipReason).toBe('no-gap');
    expect(d.isExtended).toBeUndefined();
    expect(d.placementRule).toMatch(/no safe pause point exists within 5\.0 s/);
  });

  it('the limit is measured from tStart, not from the start of the dialogue', () => {
    // Blocking dialogue is only 2.9 s long, but begins after the line and ends
    // 5.25 s after tStart once the guard is added. The old check (dialogue
    // length <= 5 s) passed this; tStart is inside the cue here, so it must refuse.
    const cues = [cue(1, 146.9, 151.75)];
    const [d] = validatePreplaced([desc('late', 147.0, 151.0)], cues, gapsFor(cues), { extended: true });
    const safe = findEarliestSafePoint(147.0, cues, gapsFor(cues));
    expect(safe).toBeNull();
    expect(d.status).toBe('skipped');
  });

  it('a pause aimed inside the 300 ms before a line starts is not safe', () => {
    // tStart is 0.1 s before dialogue: pausing there would land inside the line
    // one clock sample later. The safe point moves to the end of the dialogue.
    const cues = [cue(1, 30.1, 32.0)];
    const safe = findEarliestSafePoint(30.0, cues, gapsFor(cues));
    expect(safe).toBeCloseTo(32.3, 3);
  });

  it('extended mode never bypasses a quality gate', () => {
    const cues = [cue(1, 12, 15)];
    const [low] = validatePreplaced([desc('low', 10, 14, { confidence: 0.4 })], cues, gapsFor(cues), { extended: true });
    expect(low.status).toBe('skipped');
    expect(low.skipReason).toBe('low-confidence');
    const rejected = desc('rej', 10, 14, { status: 'skipped', skipReason: 'human-rejected' });
    const [r] = validatePreplaced([rejected], cues, gapsFor(cues), { extended: true });
    expect(r).toEqual(rejected);
  });

  it('no extended pause point ever lies inside, or within the guard before, a line of dialogue', () => {
    const cues = [cue(1, 5, 7), cue(2, 7.2, 9), cue(3, 20, 23), cue(4, 40, 41)];
    const drafts = [desc('p', 4, 8), desc('q', 6, 10), desc('r', 19, 22), desc('s', 39.9, 43)];
    for (const d of validatePreplaced(drafts, cues, gapsFor(cues), { extended: true })) {
      if (!d.isExtended) continue;
      const p = d.pausePoint!;
      expect(p - d.tStart).toBeGreaterThanOrEqual(0);
      expect(p - d.tStart).toBeLessThanOrEqual(MAX_EXTENDED_DELAY_SEC);
      for (const c of cues) expect(p >= c.tStart - 0.3 && p < c.tEnd).toBe(false);
    }
  });
});
