import { CacheStrategy } from './CacheStrategy';

export interface CacheStrategyBuilder {
  (args: any[], context?: any): CacheStrategy;
}
