import { CacheKeyBuilder, CacheClient, NoOpDeterminer, TTLBuilder, CacheStrategy } from './';

export interface CacheOptions {
  cacheKey?: string | CacheKeyBuilder;
  hashKey?: string | CacheKeyBuilder;
  client?: CacheClient;
  noop?: boolean | NoOpDeterminer;
  ttlSeconds?: number | TTLBuilder;
  strategy?: CacheStrategy;
}
