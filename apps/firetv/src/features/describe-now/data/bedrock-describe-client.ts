import { Description, DescriptionSchema, LiveDescribeRequest } from '@narratv/contracts';
import { IDescribeClient, DescribeResult } from '../domain/describe-client';

export class BedrockDescribeClient implements IDescribeClient {
  constructor(private readonly baseUrl: string) {}

  async describeFrame(request: LiveDescribeRequest): Promise<DescribeResult> {
    if (!this.baseUrl) {
      throw new Error('LIVE unavailable: API_URL not configured. Running in DEMO mode.');
    }

    const startTime = Date.now();
    const url = `${this.baseUrl.replace(/\/$/, '')}/describe`;

    let response: Response;
    try {
      response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(request)
      });
    } catch (err: any) {
      throw new Error(`LIVE unavailable: Network request failed (${err?.message || 'Connection error'})`);
    }

    const latencyMs = Date.now() - startTime;

    if (!response.ok) {
      let message = `HTTP ${response.status} ${response.statusText}`;
      try {
        const body = await response.text();
        if (body) message += ` - ${body}`;
      } catch {
        // ignore
      }
      throw new Error(`LIVE unavailable: ${message}`);
    }

    const json = await response.json();
    const description: Description = DescriptionSchema.parse(json);

    return {
      description,
      latencyMs
    };
  }
}
