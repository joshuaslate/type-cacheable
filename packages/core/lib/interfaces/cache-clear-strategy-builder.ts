import type { CacheClearStrategy } from './cache-clear-strategy';

export type CacheClearStrategyBuilder = (
  args: any[],
  context?: any,
) => CacheClearStrategy;
