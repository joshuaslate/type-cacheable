import { CacheKeyBuilder } from './CacheKeyBuilder';
import { CacheClient } from './CacheClient';
import { NoOpDeterminer } from './NoOpDeterminer';
import { TTLBuilder } from './TTLBuilder';
import { CacheKeyDeleteBuilder } from './CacheKeyDeleteBuilder';
import { CacheClearStrategy } from './CacheClearStrategy';
import { CacheClearStrategyBuilder } from './CacheClearStrategyBuilder';
import { PostRunKeyBuilder } from './PostRunKeyBuilder';
import { CacheUpdateStrategy } from './CacheUpdateStrategy';
import { CacheUpdateStrategyBuilder } from './CacheUpdateStrategyBuilder';
import { CacheClientBuilder } from './CacheClientBuilder';

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
