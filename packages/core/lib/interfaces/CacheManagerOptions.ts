import { CacheStrategy } from './CacheStrategy';
import { CacheStrategyBuilder } from './CacheStrategyBuilder';

export interface CacheManagerOptions {
  excludeContext?: boolean;
  ttlSeconds?: number;
  debug?: boolean;
  strategy?: CacheStrategy | CacheStrategyBuilder;
}
