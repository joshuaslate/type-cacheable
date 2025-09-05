import type { CacheClearStrategy } from './cache-clear-strategy';
import type { CacheClearStrategyBuilder } from './cache-clear-strategy-builder';
import type { CacheStrategy } from './cache-strategy';
import type { CacheStrategyBuilder } from './cache-strategy-builder';
import type { CacheUpdateStrategy } from './cache-update-strategy';

export interface CacheManagerOptions {
  disabled?: boolean;
  excludeContext?: boolean;
  ttlSeconds?: number;
  debug?: boolean;
  clearStrategy?: CacheClearStrategy | CacheClearStrategyBuilder;
  strategy?: CacheStrategy | CacheStrategyBuilder;
  updateStrategy?: CacheUpdateStrategy;
}
