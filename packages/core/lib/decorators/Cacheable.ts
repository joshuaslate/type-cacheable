import { CacheOptions } from '../interfaces';
import { determineOp, getFinalKey, getTTL, getCacheStrategy } from '../util';
import cacheManager from '../index';
import { DefaultStrategy } from '../strategies';

/**
 * Cacheable - This decorator allows you to first check if cached results for the
 *             decorated method exist. If so, return those, else run the decorated
 *             method, cache its return value, then return that value.
 *
 * @param options {CacheOptions}
 */
export function Cacheable(options?: CacheOptions) {
  return (
    target: Object,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) => {
    return {
      ...descriptor,
      value: async function (...args: any[]): Promise<any> {
        // Allow a client to be passed in directly for granularity, else use the connected
        // client from the main CacheManager singleton.
        const client =
          options && options.client ? options.client : cacheManager.client;

        if (options && options.noop && determineOp(options.noop, args, this)) {
          return descriptor.value!.apply(this, args);
        }

        // If there is no client, no-op is enabled (else we would have thrown before),
        // just return the result of the decorated method (no caching)
        if (!client) {
          // A caching client must exist if not set to noop, otherwise this library is doing nothing.
          if (cacheManager.options.debug) {
            console.warn(
              'type-cacheable @Cacheable was not set up with a caching client. Without a client, type-cacheable is not serving a purpose.'
            );
          }

          return descriptor.value!.apply(this, args);
        }

        const contextToUse = !cacheManager.options.excludeContext
          ? this
          : undefined;

        const finalKey = getFinalKey(
          options && options.cacheKey,
          options && options.hashKey,
          propertyKey,
          args,
          contextToUse
        );

        // TTL in seconds should prioritize options set in the decorator first,
        // the CacheManager options second, and be undefined if unset.
        const ttl =
          options && options.ttlSeconds
            ? getTTL(options.ttlSeconds, args, contextToUse)
            : cacheManager.options.ttlSeconds || undefined;

        const strategy = getCacheStrategy(
          options?.strategy ||
            cacheManager.options.strategy ||
            new DefaultStrategy(),
          args,
          contextToUse
        );

        return strategy.handle({
          debug: cacheManager.options.debug,
          originalFunction: descriptor.value,
          originalFunctionScope: this,
          originalFunctionArgs: args,
          client,
          key: finalKey,
          ttl,
        });
      },
    };
  };
}
