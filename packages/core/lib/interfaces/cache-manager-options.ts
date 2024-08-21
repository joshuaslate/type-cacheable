import { CacheStrategy } from './cache-strategy';
import { CacheStrategyBuilder } from './cache-strategy-builder';
import { CacheClearStrategy } from './cache-clear-strategy';
import { CacheClearStrategyBuilder } from './cache-clear-strategy-builder';
import { CacheUpdateStrategy } from './cache-update-strategy';

export interface CacheManagerOptions {
  disabled?: boolean;
  excludeContext?: boolean;
  ttlSeconds?: number;
  debug?: boolean;
  clearStrategy?: CacheClearStrategy | CacheClearStrategyBuilder;
  strategy?: CacheStrategy | CacheStrategyBuilder;
  updateStrategy?: CacheUpdateStrategy;
}
