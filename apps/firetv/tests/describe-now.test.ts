import { BedrockDescribeClient } from '../src/features/describe-now/data/bedrock-describe-client';

describe('Describe Live (Bedrock On-Demand Client)', () => {
  test('LIVE mode without configured API URL throws explicit error without fixture fallback', async () => {
    const client = new BedrockDescribeClient('');
    await expect(
      client.describeFrame({
        titleId: 'sintel',
        timestampSec: 15.0
      })
    ).rejects.toThrow('LIVE unavailable: API_URL not configured. Running in DEMO mode.');
  });
});
