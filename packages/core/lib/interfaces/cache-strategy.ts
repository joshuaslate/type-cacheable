import type { CacheStrategyContext } from './cache-strategy-context';

export interface CacheStrategy {
  handle(context: CacheStrategyContext): Promise<any>;
}
