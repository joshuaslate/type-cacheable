import { CacheStrategyBuilder } from '../interfaces/CacheStrategyBuilder';
import { CacheStrategy } from '../interfaces';

/**
 * getCacheStrategy - This is the strategy to use for caching data, or a function to extract it
 *
 * @param passedInCacheStrategy The desired cache strategy, or function to build the cache Strategy based on arguments/context
 * @param args        The arguments the decorated method was called with
 * @param context     The instance whose method is being called
 *
 * @returns {String}
 */
export const getCacheStrategy = (
  passedInCacheStrategy: CacheStrategy | CacheStrategyBuilder,
  args: any[],
  context?: any
): CacheStrategy => {
  // If the user passed in a cacheKey, use that. If it's a string/number, use it directly.
  // In the case of a function
  return passedInCacheStrategy instanceof Function
    ? passedInCacheStrategy(args, context)
    : passedInCacheStrategy;
};
