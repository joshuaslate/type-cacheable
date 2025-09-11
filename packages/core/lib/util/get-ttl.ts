import type { TTLBuilder } from '../interfaces';

/**
 * getTTL - This is the TTL in seconds to cache data for, or a function to extract it
 *
 * @param passedInTTL The desired TTL, or function to build the TTL based on arguments/context
 * @param args        The arguments the decorated method was called with
 * @param context     The instance whose method is being called
 *
 * @returns {String}
 */
export const getTTL = (
  passedInTTL: number | TTLBuilder,
  args: any[],
  context?: any,
): number => {
  // If the user passed in a cacheKey, use that. If it's a string/number, use it directly.
  // In the case of a function
  return passedInTTL instanceof Function
    ? passedInTTL(args, context)
    : passedInTTL;
};
