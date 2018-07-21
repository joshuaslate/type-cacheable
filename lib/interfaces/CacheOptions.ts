import { CacheKeyBuilder } from './CacheKeyBuilder';
import { CacheClient } from './CacheClient';

export interface CacheOptions {
  cacheKey?: string | CacheKeyBuilder;
  hashKey?: string | CacheKeyBuilder;
  client?: CacheClient;
  ttlSeconds?: number;
}
