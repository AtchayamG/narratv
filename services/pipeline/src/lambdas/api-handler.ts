import { LiveDescribeRequestSchema, HealthResponse } from '@narratv/contracts';
import { DescribeHandler } from './describe';
import { BedrockRuntimeClient } from '@aws-sdk/client-bedrock-runtime';
import { PollyClient } from '@aws-sdk/client-polly';
import { S3Client, ListBucketsCommand } from '@aws-sdk/client-s3';

export interface ApiEvent {
  httpMethod: string;
  path: string;
  pathParameters?: Record<string, string>;
  queryStringParameters?: Record<string, string>;
  body?: string;
  headers?: Record<string, string>;
}

export interface ApiResponse {
  statusCode: number;
  headers: Record<string, string>;
  body: string;
}

const CORS_HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization'
};

export class ApiService {
  constructor(
    private readonly bedrockClient?: BedrockRuntimeClient,
    private readonly pollyClient?: PollyClient,
    private readonly s3Client?: S3Client
  ) {}

  async handleHealth(): Promise<ApiResponse> {
    const isLive = process.env.DEMO_MODE !== 'true';
    let bedrockStatus: 'ok' | 'error' | 'unconfigured' = this.bedrockClient ? 'ok' : 'unconfigured';
    let pollyStatus: 'ok' | 'error' | 'unconfigured' = this.pollyClient ? 'ok' : 'unconfigured';
    let s3Status: 'ok' | 'error' | 'unconfigured' = this.s3Client ? 'ok' : 'unconfigured';

    if (!process.env.AWS_REGION && !process.env.AWS_DEFAULT_REGION) {
      if (isLive) {
        return {
          statusCode: 503,
          headers: CORS_HEADERS,
          body: JSON.stringify({
            error: 'Service Unavailable: AWS credentials or region not configured',
            mode: 'live',
            providers: { bedrock: 'unconfigured', polly: 'unconfigured', s3: 'unconfigured' }
          })
        };
      }
      bedrockStatus = 'unconfigured';
      pollyStatus = 'unconfigured';
      s3Status = 'unconfigured';
    }

    if (this.s3Client) {
      try {
        await this.s3Client.send(new ListBucketsCommand({}));
      } catch {
        s3Status = 'error';
      }
    }

    const health: HealthResponse = {
      mode: isLive ? 'live' : 'demo',
      providers: {
        bedrock: bedrockStatus,
        polly: pollyStatus,
        s3: s3Status
      },
      revision: process.env.APP_REVISION || '2026.09.02-pipeline.v1',
      timestamp: new Date().toISOString()
    };

    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify(health)
    };
  }

  async handleLiveDescribe(bodyText?: string): Promise<ApiResponse> {
    if (!bodyText) {
      return {
        statusCode: 400,
        headers: CORS_HEADERS,
        body: JSON.stringify({ error: 'Missing request body' })
      };
    }

    let parsed;
    try {
      parsed = LiveDescribeRequestSchema.parse(JSON.parse(bodyText));
    } catch (err: any) {
      return {
        statusCode: 400,
        headers: CORS_HEADERS,
        body: JSON.stringify({ error: `Invalid request payload: ${err.message}` })
      };
    }

    if (!this.bedrockClient) {
      return {
        statusCode: 503,
        headers: CORS_HEADERS,
        body: JSON.stringify({
          error: 'LIVE unavailable: Bedrock runtime client is not configured on backend.'
        })
      };
    }

    const describer = new DescribeHandler(this.bedrockClient);
    const description = await describer.describe({
      titleId: parsed.titleId,
      gapId: `live-${Date.now()}`,
      timestampSec: parsed.timestampSec,
      gapDurationSec: 4.0,
      frameBase64: parsed.frameBase64,
      previousDescription: parsed.previousDescription
    });

    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify(description)
    };
  }

  async route(event: ApiEvent): Promise<ApiResponse> {
    if (event.httpMethod === 'OPTIONS') {
      return { statusCode: 204, headers: CORS_HEADERS, body: '' };
    }

    const path = event.path.replace(/\/$/, '') || '/';

    if (event.httpMethod === 'GET' && path === '/health') {
      return this.handleHealth();
    }

    if (event.httpMethod === 'POST' && path === '/describe') {
      return this.handleLiveDescribe(event.body);
    }

    return {
      statusCode: 404,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: `Route not found: ${event.httpMethod} ${path}` })
    };
  }
}

export async function handler(event: ApiEvent): Promise<ApiResponse> {
  const region = process.env.AWS_REGION || 'us-east-1';
  const bedrockClient = new BedrockRuntimeClient({ region });
  const pollyClient = new PollyClient({ region });
  const s3Client = new S3Client({ region });

  const service = new ApiService(bedrockClient, pollyClient, s3Client);
  return service.route(event);
}
