import { CacheStrategy } from './CacheStrategy';
import { CacheStrategyBuilder } from './CacheStrategyBuilder';
import { CacheClearStrategy } from './CacheClearStrategy';
import { CacheClearStrategyBuilder } from './CacheClearStrategyBuilder';

export interface CacheManagerOptions {
  excludeContext?: boolean;
  ttlSeconds?: number;
  debug?: boolean;
  clearStrategy?: CacheClearStrategy | CacheClearStrategyBuilder;
  strategy?: CacheStrategy | CacheStrategyBuilder;
}
