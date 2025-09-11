import type { CacheClient, CacheClientBuilder } from '../interfaces';

/**
 * getCacheClient - Will refine a CacheClient or CacheClientBuilder to a CacheClient
 *
 * @param passedInCacheClient A CacheClient, or function to build the CacheClient based on arguments/context
 * @param args                The arguments the decorated method was called with
 * @param context             The instance whose method is being called
 *
 * @returns {CacheClient}
 */
export const getCacheClient = (
  passedInCacheClient: CacheClient | CacheClientBuilder,
  args: any[],
  context?: any,
): CacheClient => {
  // If the user passed in a cache client, use that. If it's a function to build a cache client, call it with args and context.
  return passedInCacheClient instanceof Function
    ? passedInCacheClient(args, context)
    : passedInCacheClient;
};
