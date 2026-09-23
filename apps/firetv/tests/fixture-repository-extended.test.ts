import { FixtureTrackRepository } from '../src/features/catalog/data/fixture-track-repository';

describe('FixtureTrackRepository — Primary Path Extended Mode (Correction 7)', () => {
  const repo = new FixtureTrackRepository();

  test('Sintel with extended: false (or default) maintains exact regression lock (42 playable, 2 refused)', async () => {
    const defaultTrack = await repo.getTrack('sintel');
    const falseTrack = await repo.getTrack('sintel', { extended: false });

    for (const track of [defaultTrack, falseTrack]) {
      const active = track.descriptions.filter(d => d.status !== 'skipped');
      const skipped = track.descriptions.filter(d => d.status === 'skipped');

      expect(active).toHaveLength(42);
      expect(skipped).toHaveLength(2);
      expect(skipped.map(d => d.id).sort()).toEqual(['sintel-ad-11', 'sintel-ad-28'].sort());

      for (const item of active) {
        expect(item.isExtended).toBeFalsy();
        expect(item.pausePoint).toBeUndefined();
      }
      for (const item of skipped) {
        expect(item.skipReason).toBe('no-gap');
        expect(item.placementRule).toBe('Refused: overlaps a real dialogue cue.');
      }
    }
  });

  test('Sintel with extended: true delivers sintel-ad-11 and sintel-ad-28 by safe pause points', async () => {
    const track = await repo.getTrack('sintel', { extended: true });
    const cues = await repo.getSubtitles('sintel');

    const active = track.descriptions.filter(d => d.status !== 'skipped');
    const skipped = track.descriptions.filter(d => d.status === 'skipped');
    const extended = track.descriptions.filter(d => d.isExtended);
    const normal = track.descriptions.filter(d => !d.isExtended && d.status !== 'skipped');

    // Exactly 44 playable (42 normal + 2 extended), 0 skipped
    expect(active).toHaveLength(44);
    expect(normal).toHaveLength(42);
    expect(extended).toHaveLength(2);
    expect(skipped).toHaveLength(0);

    // Track metadata
    expect(track.metadata.totalGaps).toBe(13);
    expect(track.metadata.describedCount).toBe(42);
    expect(track.metadata.extendedCount).toBe(2);
    expect(track.metadata.skippedCount).toBe(0);
    expect(track.metadata.overlapCount).toBe(0);

    // Specifically verify sintel-ad-11 and sintel-ad-28
    const ad11 = extended.find(d => d.id === 'sintel-ad-11');
    const ad28 = extended.find(d => d.id === 'sintel-ad-28');

    expect(ad11).toBeDefined();
    expect(ad28).toBeDefined();

    // Both lines start in clear air - 146.8 s is 2.05 s before its dialogue, 449.3 s
    // is 3.5 s before its - so the film pauses on the exact frame each was written
    // for. An earlier version paused at the END of the dialogue instead (152.05 s,
    // 456.8 s): 5.25 s and 7.5 s late, both past the 5 s limit it claimed to enforce.
    expect(ad11!.pausePoint).toBe(ad11!.tStart);
    expect(ad11!.pausePoint).toBe(146.8);
    expect(ad28!.pausePoint).toBe(ad28!.tStart);
    expect(ad28!.pausePoint).toBe(449.3);

    // Verify neither pausePoint lies inside any dialogue cue
    for (const item of [ad11!, ad28!]) {
      const p = item.pausePoint!;
      const insideDialogue = cues.some(c => p >= c.tStart - 0.3 && p < c.tEnd);
      expect(insideDialogue).toBe(false);
      expect(item.placementRule).toMatch(/^Extended: film pauses at /);
    }
  });

  test('the repository delegates to the shared validator rather than carrying its own copy of the rule', () => {
    // The repository once had an inline safe-point rule that measured the 5 s
    // limit from the wrong end, and the test meant to cover it never called the
    // repository - it asserted 6.0 > 5.0 on its own constant. The rule and its
    // tests now live in packages/scheduler/tests/validate-preplaced.test.ts;
    // this pins that the repository still uses it.
    const src = require('fs').readFileSync(
      require('path').join(__dirname, '../src/features/catalog/data/fixture-track-repository.ts'),
      'utf8'
    );
    expect(src).toMatch(/validatePreplaced\(rawDrafts, cues, gaps/);
    expect(src).not.toMatch(/findPreplacedSafePoint|chainEnd|chainDuration/);
  });
});
