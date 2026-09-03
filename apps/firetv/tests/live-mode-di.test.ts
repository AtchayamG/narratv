import { createTrackRepository, createDescribeClient } from '../src/core/di';
import { FixtureTrackRepository } from '../src/features/catalog/data/fixture-track-repository';
import { HttpTrackRepository } from '../src/features/catalog/data/http-track-repository';
import { BedrockDescribeClient } from '../src/features/describe-now/data/bedrock-describe-client';

describe('LIVE vs DEMO Dependency Injection & Strict Failures', () => {
  test('injects FixtureTrackRepository when isDemoMode is true', () => {
    const repo = createTrackRepository({ isDemoMode: true, apiUrl: '' });
    expect(repo).toBeInstanceOf(FixtureTrackRepository);
  });

  test('injects HttpTrackRepository when isDemoMode is false', () => {
    const repo = createTrackRepository({ isDemoMode: false, apiUrl: 'https://api.narratv.example.com' });
    expect(repo).toBeInstanceOf(HttpTrackRepository);
  });

  test('HttpTrackRepository throws actionable error when apiUrl is empty', async () => {
    const repo = new HttpTrackRepository('');
    await expect(repo.getTitles()).rejects.toThrow('API_URL is not configured');
  });

  test('creates BedrockDescribeClient with correct runtime mode', () => {
    const demoClient = createDescribeClient({ isDemoMode: true, apiUrl: '' });
    expect(demoClient).toBeInstanceOf(BedrockDescribeClient);

    const liveClient = createDescribeClient({ isDemoMode: false, apiUrl: 'https://api.narratv.example.com' });
    expect(liveClient).toBeInstanceOf(BedrockDescribeClient);
  });
});
