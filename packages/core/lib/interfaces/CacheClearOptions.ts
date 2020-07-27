import { CacheKeyBuilder } from './CacheKeyBuilder';
import { CacheClient } from './CacheClient';
import { NoOpDeterminer } from './NoOpDeterminer';
import { CacheKeyDeleteBuilder } from './CacheKeyDeleteBuilder';

export interface CacheClearOptions {
  cacheKey?: string | string[] | CacheKeyDeleteBuilder;
  hashKey?: string | CacheKeyBuilder;
  client?: CacheClient;
  fallbackClient?: CacheClient;
  noop?: boolean | NoOpDeterminer;
  isPattern?: boolean | false;
}
