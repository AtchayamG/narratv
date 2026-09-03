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
    expect(track.descriptions.length).toBeGreaterThanOrEqual(25);
    expect(track.metadata.overlapCount).toBe(0);
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
