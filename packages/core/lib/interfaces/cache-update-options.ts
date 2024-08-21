import { CacheKeyBuilder } from './cache-key-builder';
import { CacheClient } from './cache-client';
import { NoOpDeterminer } from './no-op-determiner';
import { TTLBuilder } from './ttl-builder';
import { CacheKeyDeleteBuilder } from './cache-key-delete-builder';
import { CacheClearStrategy } from './cache-clear-strategy';
import { CacheClearStrategyBuilder } from './cache-clear-strategy-builder';
import { PostRunKeyBuilder } from './post-run-key-builder';
import { CacheUpdateStrategy } from './cache-update-strategy';
import { CacheUpdateStrategyBuilder } from './cache-update-strategy-builder';
import { CacheClientBuilder } from './cache-client-builder';

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
