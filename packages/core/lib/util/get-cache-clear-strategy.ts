import type { CacheClearStrategy } from '../interfaces';
import type { CacheClearStrategyBuilder } from '../interfaces/cache-clear-strategy-builder';

/**
 * getCacheClearStrategy - This is the strategy to use for clearing cached data, or a function to extract it
 *
 * @param passedInCacheClearStrategy The desired cache strategy, or function to build the cache Strategy based on arguments/context
 * @param args        The arguments the decorated method was called with
 * @param context     The instance whose method is being called
 *
 * @returns {String}
 */
export const getCacheClearStrategy = (
  passedInCacheClearStrategy: CacheClearStrategy | CacheClearStrategyBuilder,
  args: any[],
  context?: any,
): CacheClearStrategy => {
  // If the user passed in a cacheKey, use that. If it's a string/number, use it directly.
  // In the case of a function
  return passedInCacheClearStrategy instanceof Function
    ? passedInCacheClearStrategy(args, context)
    : passedInCacheClearStrategy;
};
