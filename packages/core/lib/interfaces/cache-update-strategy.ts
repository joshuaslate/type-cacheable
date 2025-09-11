import type { CacheUpdateStrategyContext } from './cache-update-strategy-context';

export interface CacheUpdateStrategy {
  handle(context: CacheUpdateStrategyContext): Promise<any>;
}
