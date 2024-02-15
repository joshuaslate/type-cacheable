import { CacheKeyBuilder, CacheClient, NoOpDeterminer, TTLBuilder, CacheStrategy, IsCacheableBuilder } from './';
import { CacheClientBuilder } from './CacheClientBuilder';
import { CacheStrategyBuilder } from './CacheStrategyBuilder';

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
