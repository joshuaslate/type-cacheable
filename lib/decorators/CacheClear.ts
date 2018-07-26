import { CacheClearOptions } from '../interfaces';
import { getCacheKey, extractKey } from '../util';
import { MissingClientError } from '../errors';
import cacheManager from '../index';

/**
 * CacheClear - This decorator allows you to clear a key in 
 *
 * @param options {CacheOptions}
 */
export function CacheClear(options?: CacheClearOptions) {
  // Allow a client to be passed in directly for granularity, else use the connected
  // client from the main CacheManager singleton.
  const client = options && options.client
    ? options.client
    : cacheManager.client;

  return (target: Object, propertyKey: string, descriptor: PropertyDescriptor) => {
    // A caching client must exist, otherwise this library is doing nothing.
    if (!client && (!options || !options.noop)) {
      throw new MissingClientError(propertyKey);
    }

    return {
      ...descriptor,
      value: async function(...args: any[]): Promise<any> {
        // If there is no client, no-op is enabled (else we would have thrown before),
        // just return the result of the decorated method (no caching)
        if (!client) {
          return descriptor.value!.apply(this, args);
        }

        const cacheKey = getCacheKey(options && options.cacheKey, propertyKey, args, this);
        const hashKey = extractKey(options && options.hashKey, args, this);
        const finalKey = hashKey
          ? `${hashKey}:${cacheKey}`
          : cacheKey;

        // Run the decorated function
        const result = await descriptor.value!.apply(this, args);

        // Delete the requested value from cache
        await client.del(finalKey);
        return result;
      },
    };
  };
};
