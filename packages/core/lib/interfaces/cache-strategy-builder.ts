import type { CacheStrategy } from './cache-strategy';

export type CacheStrategyBuilder = (
  args: any[],
  context?: any,
) => CacheStrategy;
