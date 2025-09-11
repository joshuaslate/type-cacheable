import type {
  CacheClient,
  CacheKeyBuilder,
  CacheStrategy,
  IsCacheableBuilder,
  NoOpDeterminer,
  TTLBuilder,
} from './';
import type { CacheClientBuilder } from './cache-client-builder';
import type { CacheStrategyBuilder } from './cache-strategy-builder';

export interface CacheOptions {
  cacheKey?: string | CacheKeyBuilder;
  hashKey?: string | CacheKeyBuilder;
  client?: CacheClient | CacheClientBuilder;
  fallbackClient?: CacheClient | CacheClientBuilder;
  noop?: boolean | NoOpDeterminer;
  ttlSeconds?: number | TTLBuilder;
  strategy?: CacheStrategy | CacheStrategyBuilder;
  isCacheable?: IsCacheableBuilder;
}
