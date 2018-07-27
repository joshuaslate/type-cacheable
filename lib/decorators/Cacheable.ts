import { CacheOptions } from '../interfaces';
import { getCacheKey, extractKey, determineOp } from '../util';
import { MissingClientError } from '../errors';
import cacheManager from '../index';

/**
 * Cacheable - This decorator allows you to first check if cached results for the
 *             decorated method exist. If so, return those, else run the decorated
 *             method, cache its return value, then return that value.
 *
 * @param options {CacheOptions}
 */
export function Cacheable(options?: CacheOptions) {
  // Allow a client to be passed in directly for granularity, else use the connected
  // client from the main CacheManager singleton.
  const client = options && options.client
    ? options.client
    : cacheManager.client;

  return (target: Object, propertyKey: string, descriptor: PropertyDescriptor) => {
    return {
      ...descriptor,
      value: async function(...args: any[]): Promise<any> {
        // If there is no client, no-op is enabled (else we would have thrown before),
        // just return the result of the decorated method (no caching)
        if (!client) {
          if (options && options.noop && determineOp(options.noop, args, this)) {
            return descriptor.value!.apply(this, args);
          }

          // A caching client must exist if not set to noop, otherwise this library is doing nothing.
          throw new MissingClientError(propertyKey);
        }

        const cacheKey = getCacheKey(options && options.cacheKey, propertyKey, args, this);
        const hashKey = extractKey(options && options.hashKey, args, this);
        const finalKey = hashKey
          ? `${hashKey}:${cacheKey}`
          : cacheKey;
        const cachedValue = await client.get(finalKey);

        // If a value for the cacheKey was found in cache, simply return that.
        if (cachedValue) {
          return cachedValue;
        }

        // On a cache miss, run the decorated function and cache its return value.
        const result = await descriptor.value!.apply(this, args);

        // TTL in seconds should prioritize options set in the decorator first,
        // the CacheManager options second, and be undefined if unset.
        const ttl = options && options.ttlSeconds
          ? options.ttlSeconds
          : cacheManager.options.ttlSeconds || undefined;

        await client.set(finalKey, result, ttl);
        return result;
      },
    };
  };
};
