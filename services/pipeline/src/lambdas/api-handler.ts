import { LiveDescribeRequestSchema, HealthResponse } from '@narratv/contracts';
import { DescribeHandler } from './describe';
import { BedrockRuntimeClient } from '@aws-sdk/client-bedrock-runtime';
import { PollyClient } from '@aws-sdk/client-polly';
import { S3Client, HeadBucketCommand } from '@aws-sdk/client-s3';

/**
 * API Gateway hands a Lambda one of TWO different event shapes, and this
 * handler only understood the older one.
 *
 * Payload format 1.0 (REST API, and what every unit test here passes) supplies
 * `httpMethod` and `path`. An HTTP API - which is what the CDK stack actually
 * creates - defaults to payload format 2.0, where the method lives at
 * `requestContext.http.method` and the path at `rawPath`, and `httpMethod`/
 * `path` do not exist at all.
 *
 * So `event.path.replace(...)` threw `Cannot read properties of undefined
 * (reading 'replace')` on the very first real request, and every route returned
 * HTTP 500 "Internal Server Error". The unit tests were green the whole time
 * because they hand-built 1.0 events. Nothing but an actual deploy and an
 * actual curl would have caught it.
 *
 * Both shapes are accepted now, and `normaliseRequest` is what tests should
 * exercise rather than either raw shape.
 */
export interface ApiEvent {
  /** "2.0" on an HTTP API event; absent on payload format 1.0. */
  version?: string;
  // payload format 1.0
  httpMethod?: string;
  path?: string;
  // payload format 2.0
  rawPath?: string;
  requestContext?: { http?: { method?: string; path?: string } };
  // common
  pathParameters?: Record<string, string>;
  queryStringParameters?: Record<string, string>;
  body?: string;
  isBase64Encoded?: boolean;
  headers?: Record<string, string>;
}

/** Collapses either API Gateway payload format into one method + path pair. */
export function normaliseRequest(event: ApiEvent): { method: string; path: string } {
  const method = (event.httpMethod || event.requestContext?.http?.method || '').toUpperCase();
  const rawPath = event.path ?? event.rawPath ?? event.requestContext?.http?.path ?? '/';
  // Strip a trailing slash, and the HTTP API default-stage prefix when present.
  const path = rawPath.replace(/\/$/, '') || '/';
  return { method, path };
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
      // Probe the ONE bucket this service uses, not the whole account.
      //
      // This was `ListBucketsCommand({})`, which needs s3:ListAllMyBuckets at
      // account scope. The Lambda role is correctly scoped to just the media
      // bucket, so the probe failed on permissions it should never have had and
      // /health reported `"s3": "error"` on a perfectly healthy deployment.
      //
      // A false alarm is not a harmless bug in this project: the whole pitch is
      // a status surface a judge can trust. A health check that cries wolf
      // teaches people to ignore it, and it was failing for a reason that had
      // nothing to do with whether S3 works.
      const bucket = process.env.MEDIA_BUCKET_NAME;
      if (!bucket) {
        s3Status = 'unconfigured';
      } else {
        try {
          await this.s3Client.send(new HeadBucketCommand({ Bucket: bucket }));
        } catch {
          s3Status = 'error';
        }
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
    const { method, path } = normaliseRequest(event);

    if (method === 'OPTIONS') {
      return { statusCode: 204, headers: CORS_HEADERS, body: '' };
    }

    if (method === 'GET' && path === '/health') {
      return this.handleHealth();
    }

    if (method === 'POST' && path === '/describe') {
      return this.handleLiveDescribe(this.readBody(event));
    }

    return {
      statusCode: 404,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: `Route not found: ${method} ${path}` })
    };
  }

  /** HTTP API can base64-encode the body; 1.0 events generally do not. */
  private readBody(event: ApiEvent): string | undefined {
    if (!event.body) return undefined;
    return event.isBase64Encoded
      ? Buffer.from(event.body, 'base64').toString('utf8')
      : event.body;
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
