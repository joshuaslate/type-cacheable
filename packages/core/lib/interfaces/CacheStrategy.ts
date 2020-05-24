import { CacheStrategyContext } from './CacheStrategyContext';

export interface CacheStrategy {
  handle(context: CacheStrategyContext): Promise<any>;
}
