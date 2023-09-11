import { CacheStrategy } from './CacheStrategy';
import { CacheStrategyBuilder } from './CacheStrategyBuilder';
import { CacheClearStrategy } from './CacheClearStrategy';
import { CacheClearStrategyBuilder } from './CacheClearStrategyBuilder';
import { CacheUpdateStrategy } from './CacheUpdateStrategy';

export interface CacheManagerOptions {
  disabled?: boolean;
  excludeContext?: boolean;
  ttlSeconds?: number;
  debug?: boolean;
  clearStrategy?: CacheClearStrategy | CacheClearStrategyBuilder;
  strategy?: CacheStrategy | CacheStrategyBuilder;
  updateStrategy?: CacheUpdateStrategy;
}
