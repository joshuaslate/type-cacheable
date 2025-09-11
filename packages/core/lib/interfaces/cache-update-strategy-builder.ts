import type { CacheUpdateStrategy } from './cache-update-strategy';

export type CacheUpdateStrategyBuilder = (
  args: any[],
  context?: any,
  returnValue?: any,
) => CacheUpdateStrategy;
