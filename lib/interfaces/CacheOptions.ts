import { CacheKeyBuilder, CacheClient, NoOpDeterminer, TTLBuilder } from './';

export interface CacheOptions {
  cacheKey?: string | CacheKeyBuilder;
  hashKey?: string | CacheKeyBuilder;
  client?: CacheClient;
  noop?: boolean | NoOpDeterminer;
  ttlSeconds?: number | TTLBuilder;
}
