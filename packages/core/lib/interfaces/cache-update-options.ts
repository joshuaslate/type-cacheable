import type { CacheClearStrategy } from './cache-clear-strategy';
import type { CacheClearStrategyBuilder } from './cache-clear-strategy-builder';
import type { CacheClient } from './cache-client';
import type { CacheClientBuilder } from './cache-client-builder';
import type { CacheKeyBuilder } from './cache-key-builder';
import type { CacheKeyDeleteBuilder } from './cache-key-delete-builder';
import type { CacheUpdateStrategy } from './cache-update-strategy';
import type { CacheUpdateStrategyBuilder } from './cache-update-strategy-builder';
import type { NoOpDeterminer } from './no-op-determiner';
import type { PostRunKeyBuilder } from './post-run-key-builder';
import type { TTLBuilder } from './ttl-builder';

export interface CacheUpdateOptions {
  cacheKey?: string | CacheKeyBuilder | PostRunKeyBuilder;
  cacheKeysToClear?: string | string[] | CacheKeyDeleteBuilder | null;
  hashKey?: string | CacheKeyBuilder | PostRunKeyBuilder;
  client?: CacheClient | CacheClientBuilder;
  fallbackClient?: CacheClient | CacheClientBuilder;
  noop?: boolean | NoOpDeterminer;
  ttlSeconds?: number | TTLBuilder;
  strategy?: CacheUpdateStrategy | CacheUpdateStrategyBuilder;
  clearStrategy?: CacheClearStrategy | CacheClearStrategyBuilder;
  clearAndUpdateInParallel?: boolean;
}
