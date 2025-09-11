import type { CacheClearStrategy } from './cache-clear-strategy';
import type { CacheClearStrategyBuilder } from './cache-clear-strategy-builder';
import type { CacheClient } from './cache-client';
import type { CacheClientBuilder } from './cache-client-builder';
import type { CacheKeyBuilder } from './cache-key-builder';
import type { CacheKeyDeleteBuilder } from './cache-key-delete-builder';
import type { NoOpDeterminer } from './no-op-determiner';

export interface CacheClearOptions {
  cacheKey?: string | string[] | CacheKeyDeleteBuilder;
  hashKey?: string | CacheKeyBuilder;
  client?: CacheClient | CacheClientBuilder;
  fallbackClient?: CacheClient | CacheClientBuilder;
  noop?: boolean | NoOpDeterminer;
  isPattern?: boolean;
  strategy?: CacheClearStrategy | CacheClearStrategyBuilder;
}
