import { CacheClearStrategy } from './CacheClearStrategy';

export interface CacheClearStrategyBuilder {
  (args: any[], context?: any): CacheClearStrategy;
}
