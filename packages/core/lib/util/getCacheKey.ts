import { createHash } from 'crypto';
import * as serialize from 'serialize-javascript';
import { CacheKeyBuilder, CacheKeyDeleteBuilder } from '../interfaces';

export type CacheClearKey = string | string[] | CacheKeyDeleteBuilder;
export type CacheableKey = string | CacheKeyBuilder;

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
  passedInKey: string | string[] | CacheKeyBuilder | CacheKeyDeleteBuilder = '',
  args: any[],
  context?: any,
): string | string[] => {
  // If the user passed in a cacheKey, use that. If it's a string, use it directly.
  // In the case of a function, we'll use the result of the called function.
  return passedInKey instanceof Function ? passedInKey(args, context) : passedInKey;
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
  passedInKey: string | string[] | CacheKeyBuilder | CacheKeyDeleteBuilder = '',
  methodName: string,
  args: any[],
  context?: any,
): string | string[] => {
  // If the user passed in a cacheKey, use that. If it's a string, use it directly.
  // In the case of a function, we'll use the result of the called function.
  if (passedInKey) {
    return extractKey(passedInKey, args, context);
  }

  // Fall back to a default value (md5 hash of serialized arguments and context,
  // which is the instance the method was called from)
  const callMap = {
    args,
    methodName,
    context,
  };

  const serializedKey = serialize(callMap);
  return createHash('md5').update(serializedKey).digest('hex');
};

export const getFinalKey = (
  passedCacheKey: CacheableKey | CacheClearKey = '',
  passedHashKey: string | CacheKeyBuilder = '',
  methodName: string,
  args: any[],
  context?: any,
): string | string[] => {
  const cacheKey = getCacheKey(passedCacheKey, methodName, args, context);
  const hashKey = extractKey(passedHashKey, args, context) as string;

  if (Array.isArray(cacheKey)) {
    return cacheKey.map((key) => (hashKey ? `${hashKey}:${key}` : key));
  }

  return hashKey ? `${hashKey}:${cacheKey}` : cacheKey;
};
