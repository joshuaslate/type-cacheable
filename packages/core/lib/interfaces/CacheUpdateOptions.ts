import { CacheKeyBuilder } from './CacheKeyBuilder';
import { CacheClient } from './CacheClient';
import { NoOpDeterminer } from './NoOpDeterminer';
import { TTLBuilder } from './TTLBuilder';
import { CacheStrategy } from './CacheStrategy';
import { CacheStrategyBuilder } from './CacheStrategyBuilder';
import { CacheKeyDeleteBuilder } from './CacheKeyDeleteBuilder';
import { CacheClearStrategy } from './CacheClearStrategy';
import { CacheClearStrategyBuilder } from './CacheClearStrategyBuilder';

export interface CacheUpdateOptions {
  cacheKey?: string | CacheKeyBuilder;
  cacheKeysToClear?: string | string[] | CacheKeyDeleteBuilder;
  hashKey?: string | CacheKeyBuilder;
  client?: CacheClient;
  fallbackClient?: CacheClient;
  noop?: boolean | NoOpDeterminer;
  ttlSeconds?: number | TTLBuilder;
  strategy?: CacheStrategy | CacheStrategyBuilder;
  clearStrategy?: CacheClearStrategy | CacheClearStrategyBuilder;
  clearAndUpdateInParallel?: boolean;
}
