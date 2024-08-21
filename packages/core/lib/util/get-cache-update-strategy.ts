import { CacheUpdateStrategy, CacheUpdateStrategyBuilder } from '../interfaces';

/**
 * getCacheUpdateStrategy - This is the strategy to use for updating cached data, or a function to extract it
 *
 * @param passedInCacheStrategy The desired cache strategy, or function to build the cache Strategy based on arguments/context
 * @param args        The arguments the decorated method was called with
 * @param context     The instance whose method is being called
 * @param returnValue The result of the decorated method, used to calculate cache key
 *
 * @returns {String}
 */
export const getCacheUpdateStrategy = (
  passedInCacheStrategy: CacheUpdateStrategy | CacheUpdateStrategyBuilder,
  args: any[],
  context?: any,
  returnValue?: any,
): CacheUpdateStrategy =>
  passedInCacheStrategy instanceof Function
    ? passedInCacheStrategy(args, context, returnValue)
    : passedInCacheStrategy;
