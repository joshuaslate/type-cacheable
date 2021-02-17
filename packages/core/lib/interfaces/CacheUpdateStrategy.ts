import { CacheUpdateStrategyContext } from './CacheUpdateStrategyContext';

export interface CacheUpdateStrategy {
  handle(context: CacheUpdateStrategyContext): Promise<any>;
}
