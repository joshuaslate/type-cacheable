import { CacheUpdateStrategy } from './cache-update-strategy';

export interface CacheUpdateStrategyBuilder {
  (args: any[], context?: any, returnValue?: any): CacheUpdateStrategy;
}
