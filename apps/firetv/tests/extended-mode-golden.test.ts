import { FixtureTrackRepository } from '../src/features/catalog/data/fixture-track-repository';
import { parseSrt, findGaps, placeDescriptions } from '@narratv/scheduler';

describe('Criterion A — Regression Lock: Golden Fixtures with Extended OFF', () => {
  const repo = new FixtureTrackRepository();

  test('Sintel primary repository path with extended OFF: exactly 42 playable, 2 refused', async () => {
    const track = await repo.getTrack('sintel');

    expect(track.titleId).toBe('sintel');
    expect(track.descriptions).toHaveLength(44);

    const playable = track.descriptions.filter(d => d.status !== 'skipped');
    const refused = track.descriptions.filter(d => d.status === 'skipped');

    // Pin today's exact counts
    expect(playable).toHaveLength(42);
    expect(refused).toHaveLength(2);

    // Pin the exact 2 refused descriptions
    expect(refused.map(d => d.id).sort()).toEqual(['sintel-ad-11', 'sintel-ad-28']);
    expect(refused[0].skipReason).toBe('no-gap');
    expect(refused[1].skipReason).toBe('no-gap');

    // Pin metadata counters
    expect(track.metadata.describedCount).toBe(42);
    expect(track.metadata.skippedCount).toBe(2);
    expect(track.metadata.totalGaps).toBe(13);
    expect(track.metadata.overlapCount).toBe(0);

    // Snapshot id, status, skipReason, tStart, tEnd for all 44 descriptions
    const snapshot = track.descriptions.map(d => ({
      id: d.id,
      status: d.status,
      skipReason: d.skipReason || null,
      tStart: d.tStart,
      tEnd: d.tEnd
    }));

    // Verify first 5 and specific key descriptions to guarantee no drift
    expect(snapshot[0]).toEqual({
      id: 'sintel-ad-01',
      status: 'verified',
      skipReason: null,
      tStart: 2,
      tEnd: 6.14
    });

    const ad11 = snapshot.find(s => s.id === 'sintel-ad-11');
    expect(ad11).toEqual({
      id: 'sintel-ad-11',
      status: 'skipped',
      skipReason: 'no-gap',
      tStart: 146.8,
      tEnd: 151.78
    });

    const ad28 = snapshot.find(s => s.id === 'sintel-ad-28');
    expect(ad28).toEqual({
      id: 'sintel-ad-28',
      status: 'skipped',
      skipReason: 'no-gap',
      tStart: 449.3,
      tEnd: 455.12
    });
  });

  test('Big Buck Bunny & Elephants Dream fixtures: zero AD tracks (0/0 pins nothing)', async () => {
    // Big Buck Bunny is non-dialogue animation with no pre-recorded description track.
    const bbbTrack = await repo.getTrack('big-buck-bunny');
    expect(bbbTrack.descriptions).toHaveLength(0);
    expect(bbbTrack.metadata.describedCount).toBe(0);

    // Elephants Dream has dialogue cues but no pre-recorded description track.
    const edTrack = await repo.getTrack('elephants-dream');
    expect(edTrack.descriptions).toHaveLength(0);
    expect(edTrack.metadata.describedCount).toBe(0);

    // Explicit architectural assertion: Big Buck Bunny and Elephants Dream have no AD track,
    // so their 0/0 pins nothing regarding description placement.
  });

  test('Draft pipeline path (placeDescriptions) over Sintel drafts pins 11 scheduled / 33 skipped', async () => {
    const rawSintelTrack = require('../assets/fixtures/sintel-track.json');
    const drafts = rawSintelTrack.descriptions;
    const cues = await repo.getSubtitles('sintel');
    const gaps = findGaps(cues, { minGapSec: 2.5, guardMs: 300, totalDurationSec: 888.064 });

    const result = placeDescriptions(gaps, drafts);
    expect(result.scheduled).toHaveLength(11);
    expect(result.skipped).toHaveLength(33);
    expect(result.counters.describedCount).toBe(11);
    expect(result.counters.skippedCount).toBe(33);
    expect(result.counters.skippedByReason['no-gap']).toBe(31);
    expect(result.counters.skippedByReason['too-long']).toBe(2);
  });
});
