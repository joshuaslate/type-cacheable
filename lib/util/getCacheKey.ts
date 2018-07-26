import * as md5 from 'md5';
import * as serialize from 'serialize-javascript';
import { CacheKeyBuilder } from '../interfaces';

/**
 * extractKey - If data should be stored in a hash, this would be the name of the hash
 *
 * @param passedInKey The desired key, or function to build the key based on arguments
 * @param args        The arguments the decorated method was called with
 * @param context     The instance whose method is being called
 * 
 * @returns {String}
 */
export const extractKey = (passedInKey: string | CacheKeyBuilder = '', args: any[], context?: any): string => {
  // If the user passed in a cacheKey, use that. If it's a string/number, use it directly.
  // In the case of a function
  return passedInKey instanceof Function
    ? passedInKey(args, context)
    : passedInKey;
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
export const getCacheKey = (passedInKey: string | CacheKeyBuilder = '', methodName: string, args: any[], context?: any): string => {
  // If the user passed in a cacheKey, use that. If it's a string/number, use it directly.
  // In the case of a function
  if (passedInKey) {
    return extractKey(passedInKey, args, context);
  }

  // Fall back to a default value (md5 hash of serialized arguments and context,
  // which is the instance the method was called from)
  const callMap = {
    args: args,
    methodName,
    context,
  };

  const serializedKey = serialize(callMap);
  const hashedKey = md5(serializedKey);
  return hashedKey;
};

export const getSeparatedKeys = (cacheKey: string): string[] | null => cacheKey.includes(':')
  ? cacheKey.split(':')
  : null;
