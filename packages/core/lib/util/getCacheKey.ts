import md5 from 'blueimp-md5';
import serialize from 'serialize-javascript';
import { CacheKeyBuilder, CacheKeyDeleteBuilder, PostRunKeyBuilder } from '../interfaces';

export type CacheClearKey = string | string[] | CacheKeyDeleteBuilder;
export type CacheableKey = string | CacheKeyBuilder;
export type CacheUpdateKey = string | CacheKeyBuilder | PostRunKeyBuilder;

/**
 * extractKey - If data should be stored in a hash, this would be the name of the hash
 *
 * @param passedInKey The desired key, or function to build the key based on arguments/context
 * @param args        The arguments the decorated method was called with
 * @param context     The instance whose method is being called
 *
 * @returns {String}
 */
export const extractKey = (
  passedInKey: string | string[] | CacheKeyBuilder | CacheUpdateKey | CacheKeyDeleteBuilder | PostRunKeyBuilder = '',
  args: any[],
  context?: any,
  returnValue?: any,
): string | string[] => {
  // If the user passed in a cacheKey, use that. If it's a string, use it directly.
  // In the case of a function, we'll use the result of the called function.
  return passedInKey instanceof Function ? passedInKey(args, context, returnValue) : passedInKey;
};

/**
 * getCacheKey - Determines the cache key to use. Either from an argument extractor function,
 *               string, or number that is passed in, or a hash based on args decorated function
 *               was called with (by default)
 *
 * @param methodName  The name of the method being called
 * @param passedInKey The desired key, or function to build the key based on arguments
 * @param args        The arguments the decorated method was called with
 * @param context     The instance whose method is being called
 *
 * @returns {String}
 */
export const getCacheKey = (
  passedInKey: string | string[] | CacheKeyBuilder | CacheKeyDeleteBuilder | CacheUpdateKey | PostRunKeyBuilder = '',
  methodName: string,
  args: any[],
  context?: any,
  returnValue?: any,
): string | string[] => {
  // If the user passed in a cacheKey, use that. If it's a string, use it directly.
  // In the case of a function, we'll use the result of the called function.
  if (passedInKey) {
    return extractKey(passedInKey, args, context, returnValue);
  }

  // Fall back to a default value (md5 hash of serialized arguments and context,
  // which is the instance the method was called from)
  const callMap = {
    args,
    methodName,
    context,
  };

  const serializedKey = serialize(callMap);
  return md5(serializedKey);
};

export const getFinalKey = (
  passedCacheKey: CacheableKey | CacheClearKey | CacheUpdateKey | PostRunKeyBuilder = '',
  passedHashKey: string | CacheKeyBuilder | PostRunKeyBuilder = '',
  methodName: string,
  args: any[],
  context?: any,
  returnValue?: any,
): string | string[] => {
  const cacheKey = getCacheKey(passedCacheKey, methodName, args, context, returnValue);
  const hashKey = extractKey(passedHashKey, args, context, returnValue) as string;

  if (Array.isArray(cacheKey)) {
    return cacheKey.map((key) => (hashKey ? `${hashKey}:${key}` : key));
  }

  return hashKey ? `${hashKey}:${cacheKey}` : cacheKey;
};
