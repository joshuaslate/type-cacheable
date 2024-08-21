import { CacheClearStrategy } from './cache-clear-strategy';

export interface CacheClearStrategyBuilder {
  (args: any[], context?: any): CacheClearStrategy;
}
