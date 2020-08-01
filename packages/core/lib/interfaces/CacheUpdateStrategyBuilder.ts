import { CacheUpdateStrategy } from './CacheUpdateStrategy';

export interface CacheUpdateStrategyBuilder {
  (args: any[], context?: any, returnValue?: any): CacheUpdateStrategy;
}
