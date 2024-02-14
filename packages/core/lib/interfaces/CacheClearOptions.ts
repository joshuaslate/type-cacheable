import { CacheKeyBuilder } from './CacheKeyBuilder';
import { CacheClient } from './CacheClient';
import { NoOpDeterminer } from './NoOpDeterminer';
import { CacheKeyDeleteBuilder } from './CacheKeyDeleteBuilder';
import { CacheClearStrategyBuilder } from './CacheClearStrategyBuilder';
import { CacheClearStrategy } from './CacheClearStrategy';
import { CacheClientBuilder } from './CacheClientBuilder';

export interface CacheClearOptions {
  cacheKey?: string | string[] | CacheKeyDeleteBuilder;
  hashKey?: string | CacheKeyBuilder;
  client?: CacheClient | CacheClientBuilder;
  fallbackClient?: CacheClient | CacheClientBuilder;
  noop?: boolean | NoOpDeterminer;
  isPattern?: boolean;
  strategy?: CacheClearStrategy | CacheClearStrategyBuilder;
}
