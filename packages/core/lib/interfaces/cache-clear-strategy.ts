import { CacheClearStrategyContext } from './cache-clear-strategy-context';

export interface CacheClearStrategy {
  handle(context: CacheClearStrategyContext): Promise<any>;
}
