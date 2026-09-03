import { FixtureTrackRepository } from '../src/features/catalog/data/fixture-track-repository';
import { HttpTrackRepository } from '../src/features/catalog/data/http-track-repository';
import { BedrockDescribeClient } from '../src/features/describe-now/data/bedrock-describe-client';

describe('DI & Data Layer Isolation', () => {
  test('FixtureTrackRepository loads titles and computes 0 overlaps on Sintel', async () => {
    const repo = new FixtureTrackRepository();
    const titles = await repo.getTitles();
    expect(titles.length).toBeGreaterThanOrEqual(3);

    const sintel = await repo.getTitle('sintel');
    expect(sintel).not.toBeNull();
    expect(sintel?.name).toBe('Sintel');

    const track = await repo.getTrack('sintel');
    expect(track.metadata.overlapCount).toBe(0);

    // NOTE: this test previously asserted `descriptions.length >= 25`. That is a
    // quantity assertion, and it passed happily against a track of 28 invented
    // descriptions placed over a fabricated subtitle file. It rewarded exactly
    // the fault it should have caught. What follows asserts CORRECTNESS instead:
    // every description must sit in real silence and never collide.
    expect(track.descriptions.length).toBeGreaterThan(0);
  });

  test('no description overlaps another description', async () => {
    const repo = new FixtureTrackRepository();
    const { descriptions } = await repo.getTrack('sintel');
    const active = descriptions
      .filter(d => d.status !== 'skipped')
      .sort((a, b) => a.tStart - b.tStart);

    for (let i = 1; i < active.length; i++) {
      expect(active[i].tStart).toBeGreaterThan(active[i - 1].tEnd);
    }
  });

  test('HARD INVARIANT: no description collides with real dialogue', async () => {
    const repo = new FixtureTrackRepository();
    const { descriptions } = await repo.getTrack('sintel');
    const cues = await repo.getSubtitles('sintel');
    expect(cues.length).toBeGreaterThan(0);

    // The film's first spoken word is at 107.25s (official Wikimedia Commons
    // subtitle track). Anything scheduled before that is in genuine silence.
    const firstCue = Math.min(...cues.map(c => c.tStart));
    expect(firstCue).toBeGreaterThan(107);

    for (const d of descriptions.filter(x => x.status !== 'skipped')) {
      for (const cue of cues) {
        const collides = d.tStart < cue.tEnd && d.tEnd > cue.tStart;
        if (collides) {
          throw new Error(
            `${d.id} (${d.tStart}-${d.tEnd}s) talks over dialogue "${cue.text}" (${cue.tStart}-${cue.tEnd}s)`
          );
        }
      }
    }
  });

  test('every description is traceable to a frame of the real stream', async () => {
    const repo = new FixtureTrackRepository();
    const { descriptions, metadata } = await repo.getTrack('sintel');

    // Guards against a plot-summary track reappearing: each entry must name the
    // frame it was written from, and the model field must not claim AI output
    // it did not come from.
    for (const d of descriptions.filter(x => x.status !== 'skipped')) {
      expect(d.frameRef).toMatch(/^sintel@\d{2}:\d{2}$/);
      expect(d.model).toBe('human-verified-frames');
    }
    expect(metadata.model).toBe('human-verified-frames');
  });

  test('HttpTrackRepository throws explicit error when API_URL is unconfigured', async () => {
    const repo = new HttpTrackRepository('');
    await expect(repo.getTitles()).rejects.toThrow('LIVE unavailable: API_URL is not configured');
  });

  test('BedrockDescribeClient throws explicit error when API_URL is unconfigured', async () => {
    const client = new BedrockDescribeClient('');
    await expect(
      client.describeFrame({ titleId: 'sintel', timestampSec: 10.0 })
    ).rejects.toThrow('LIVE unavailable: API_URL not configured');
  });
});
