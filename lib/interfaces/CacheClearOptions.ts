import { CacheKeyBuilder } from './CacheKeyBuilder';
import { CacheClient } from './CacheClient';

export interface CacheClearOptions {
  cacheKey?: string | CacheKeyBuilder;
  hashKey?: string | CacheKeyBuilder;
  client?: CacheClient;
  noop?: boolean;
}
