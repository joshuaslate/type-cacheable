import { CacheClearStrategyContext } from './CacheClearStrategyContext';

export interface CacheClearStrategy {
  handle(context: CacheClearStrategyContext): Promise<any>;
}
