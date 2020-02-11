import {CacheClearOptions} from '../interfaces';
import {determineOp, getFinalKey} from '../util';
import cacheManager from '../index';

/**
 * CacheClear - This decorator allows you to clear a key in
 *
 * @param options {CacheOptions}
 */
export function CacheClear(options?: CacheClearOptions) {
  return (target: Object, propertyKey: string, descriptor: PropertyDescriptor) => {
    return {
      ...descriptor,
      value: async function(...args: any[]): Promise<any> {
        // Allow a client to be passed in directly for granularity, else use the connected
        // client from the main CacheManager singleton.
        const client = options && options.client
          ? options.client
          : cacheManager.client;

        // If there is no client, no-op is enabled (else we would have thrown before),
        // just return the result of the decorated method (no caching)
        if (!client) {
          if (options && options.noop && determineOp(options.noop, args, this)) {
            return descriptor.value!.apply(this, args);
          }

          // A caching client must exist if not set to noop, otherwise this library is doing nothing.
          if (cacheManager.options.debug) {
            console.warn('type-cacheable @CacheClear was not set up with a caching client. Without a client, type-cacheable is not serving a purpose.');
          }

          return descriptor.value!.apply(this, args);
        }

        const contextToUse = !cacheManager.options.excludeContext
          ? this
          : undefined;
        const finalKey = getFinalKey(options && options.cacheKey, options && options.hashKey, propertyKey, args, contextToUse);

        // Run the decorated method
        const result = await descriptor.value!.apply(this, args);

        try {
          if (options && options.isPattern) {
            // Delete keys that match a string pattern
            await client.del(await client.keys(finalKey));
          } else {
            // Delete the requested value from cache
            await client.del(finalKey);
          }
        } catch (err) {
          if (cacheManager.options.debug) {
            console.warn(`type-cacheable CacheClear failure due to client error: ${err.message}`);
          }
        }

        return result;
      },
    };
  };
};
