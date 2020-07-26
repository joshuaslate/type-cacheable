import { CacheKeyBuilder, CacheClient, NoOpDeterminer, TTLBuilder, CacheStrategy } from './';
import { CacheStrategyBuilder } from './CacheStrategyBuilder';

export interface CacheOptions {
  cacheKey?: string | CacheKeyBuilder;
  hashKey?: string | CacheKeyBuilder;
  client?: CacheClient;
  fallbackClient?: CacheClient;
  noop?: boolean | NoOpDeterminer;
  ttlSeconds?: number | TTLBuilder;
  strategy?: CacheStrategy | CacheStrategyBuilder;
}
