import { CacheKeyBuilder, CacheClient, NoOpDeterminer, TTLBuilder, CacheStrategy, IsCacheableBuilder } from './';
import { CacheClientBuilder } from './cache-client-builder';
import { CacheStrategyBuilder } from './cache-strategy-builder';

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
