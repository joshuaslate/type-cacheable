import { CacheOptions } from '../interfaces';
import { determineOp, getCacheStrategy, getFinalKey, getTTL, setMetadata } from '../util';
import cacheManager from '../index';
import { DefaultStrategy } from '../strategies';
import { getCacheClient } from '../util/getCacheClient';

/**
 * Cacheable - This decorator allows you to first check if cached results for the
 *             decorated method exist. If so, return those, else run the decorated
 *             method, cache its return value, then return that value.
 *
 * @param options {CacheOptions}
 */
export function Cacheable(options?: CacheOptions) {
  return (target: Object, propertyKey: string, descriptor?: PropertyDescriptor) => {
    const originalMethod = descriptor?.value;
    const defaultStrategy = new DefaultStrategy();

    const newDescriptor: PropertyDescriptor = {
      ...descriptor,
      value: async function (...args: any[]): Promise<any> {
        // Allow a client to be passed in directly for granularity, else use the connected
        // client from the main CacheManager singleton.
        const _client = options && options.client ? options.client : cacheManager.client;
        const _fallbackClient =
          options && options.fallbackClient ? options.fallbackClient : cacheManager.fallbackClient;

        if (cacheManager.options?.disabled || (options && options.noop && determineOp(options.noop, args, this))) {
          return originalMethod?.apply(this, args);
        }

        // If there is no client, no-op is enabled (else we would have thrown before),
        // just return the result of the decorated method (no caching)
        if (!_client) {
          // A caching client must exist if not set to noop, otherwise this library is doing nothing.
          if (cacheManager.options.debug) {
            console.warn(
              'type-cacheable @Cacheable was not set up with a caching client. Without a client, type-cacheable is not serving a purpose.',
            );
          }

          return originalMethod?.apply(this, args);
        }

        const contextToUse = !cacheManager.options.excludeContext ? this : undefined;

        const client = getCacheClient(_client, args, contextToUse);
        const fallbackClient = _fallbackClient ? getCacheClient(_fallbackClient, args, contextToUse) : null;

        const finalKey = getFinalKey(
          options && options.cacheKey,
          options && options.hashKey,
          propertyKey,
          args,
          contextToUse,
        );

        // TTL in seconds should prioritize options set in the decorator first,
        // the CacheManager options second, and be undefined if unset.
        const ttl =
          options && options.ttlSeconds
            ? getTTL(options.ttlSeconds, args, contextToUse)
            : cacheManager.options.ttlSeconds || undefined;

        const isCacheable = (value: any) =>
          options && options.isCacheable
            ? options.isCacheable(value, args, contextToUse)
            : true;

        const strategy = getCacheStrategy(
          options?.strategy || cacheManager.options.strategy || defaultStrategy,
          args,
          contextToUse,
        );

        return strategy.handle({
          debug: cacheManager.options.debug,
          originalMethod,
          originalPropertyKey: propertyKey,
          originalMethodScope: this,
          originalMethodArgs: args,
          client,
          fallbackClient,
          key: finalKey as string,
          ttl,
          isCacheable,
        });
      },
    };

    setMetadata(newDescriptor, originalMethod);
    return newDescriptor;
  };
}
