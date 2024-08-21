import { CacheKeyBuilder } from './cache-key-builder';
import { CacheClient } from './cache-client';
import { NoOpDeterminer } from './no-op-determiner';
import { CacheKeyDeleteBuilder } from './cache-key-delete-builder';
import { CacheClearStrategyBuilder } from './cache-clear-strategy-builder';
import { CacheClearStrategy } from './cache-clear-strategy';
import { CacheClientBuilder } from './cache-client-builder';

export interface CacheClearOptions {
  cacheKey?: string | string[] | CacheKeyDeleteBuilder;
  hashKey?: string | CacheKeyBuilder;
  client?: CacheClient | CacheClientBuilder;
  fallbackClient?: CacheClient | CacheClientBuilder;
  noop?: boolean | NoOpDeterminer;
  isPattern?: boolean;
  strategy?: CacheClearStrategy | CacheClearStrategyBuilder;
}
