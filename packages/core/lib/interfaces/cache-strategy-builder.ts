import { CacheStrategy } from './cache-strategy';

export interface CacheStrategyBuilder {
  (args: any[], context?: any): CacheStrategy;
}
