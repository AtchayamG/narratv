import { config } from './config';
import { ITrackRepository } from '../features/catalog/domain/repository';
import { FixtureTrackRepository } from '../features/catalog/data/fixture-track-repository';
import { HttpTrackRepository } from '../features/catalog/data/http-track-repository';
import { IDescribeClient } from '../features/describe-now/domain/describe-client';
import { BedrockDescribeClient } from '../features/describe-now/data/bedrock-describe-client';

export interface ServiceContainer {
  trackRepository: ITrackRepository;
  describeClient: IDescribeClient;
}

export function createTrackRepository(options?: { isDemoMode?: boolean; apiUrl?: string }): ITrackRepository {
  const isDemo = options?.isDemoMode !== undefined ? options.isDemoMode : config.demoMode;
  const apiUrl = options?.apiUrl !== undefined ? options.apiUrl : config.apiUrl;

  return isDemo
    ? new FixtureTrackRepository()
    : new HttpTrackRepository(apiUrl);
}

export function createDescribeClient(options?: { isDemoMode?: boolean; apiUrl?: string }): IDescribeClient {
  const apiUrl = options?.apiUrl !== undefined ? options.apiUrl : config.apiUrl;
  return new BedrockDescribeClient(apiUrl);
}

export function createContainer(): ServiceContainer {
  return {
    trackRepository: createTrackRepository(),
    describeClient: createDescribeClient()
  };
}

export const container = createContainer();
