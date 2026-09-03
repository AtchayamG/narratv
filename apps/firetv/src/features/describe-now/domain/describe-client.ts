import { Description, LiveDescribeRequest } from '@narratv/contracts';

export interface DescribeResult {
  description: Description;
  latencyMs: number;
}

export interface IDescribeClient {
  describeFrame(request: LiveDescribeRequest): Promise<DescribeResult>;
}
