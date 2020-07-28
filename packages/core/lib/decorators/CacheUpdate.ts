import { CacheUpdateOptions } from '../interfaces';
import { determineOp, getFinalKey, getTTL, getCacheStrategy, getCacheClearStrategy } from '../util';
import cacheManager from '../index';
import { DefaultStrategy } from '../strategies';
import { DefaultClearStrategy } from '../strategies/DefaultClearStrategy';

/**
 * CacheUpdate - This decorator allows you to update a cached value
 *
 * @param options {CacheUpdateOptions}
 */
export function CacheUpdate(options?: CacheUpdateOptions) {
  return (target: Object, propertyKey: string, descriptor: PropertyDescriptor) => {
    const originalMethod = descriptor.value;

    return {
      ...descriptor,
      value: async function (...args: any[]): Promise<any> {
        // Allow a client to be passed in directly for granularity, else use the connected
        // client from the main CacheManager singleton.
        const client = options && options.client ? options.client : cacheManager.client;
        const fallbackClient =
          options && options.fallbackClient ? options.fallbackClient : cacheManager.fallbackClient;

        if (options && options.noop && determineOp(options.noop, args, this)) {
          return originalMethod!.apply(this, args);
        }

        // If there is no client, no-op is enabled (else we would have thrown before),
        // just return the result of the decorated method (no caching)
        if (!client) {
          // A caching client must exist if not set to noop, otherwise this library is doing nothing.
          if (cacheManager.options.debug) {
            console.warn(
              'type-cacheable @CacheUpdate was not set up with a caching client. Without a client, type-cacheable is not serving a purpose.',
            );
          }

          return originalMethod!.apply(this, args);
        }

        const contextToUse = !cacheManager.options.excludeContext ? this : undefined;

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

        const strategy = getCacheStrategy(
          options?.strategy || cacheManager.options.strategy || new DefaultStrategy(),
          args,
          contextToUse,
        );

        const finalClearKey = getFinalKey(
          options && options.cacheKeysToClear,
          options && options.hashKey,
          propertyKey,
          args,
          contextToUse,
        );

        const clearStrategy = getCacheClearStrategy(
          options?.clearStrategy ||
            cacheManager.options.clearStrategy ||
            new DefaultClearStrategy(),
          args,
          contextToUse,
        );

        if (options?.clearAndUpdateInParallel) {
          const promises = [
            strategy.handle({
              debug: cacheManager.options.debug,
              originalMethod,
              originalMethodScope: this,
              originalMethodArgs: args,
              client,
              fallbackClient,
              forceUpdate: true,
              key: finalKey as string,
              ttl,
            }),
          ];

          if (finalClearKey.length) {
            promises.push(
              clearStrategy.handle({
                debug: cacheManager.options.debug,
                originalMethod,
                originalMethodScope: this,
                originalMethodArgs: args,
                client,
                fallbackClient,
                key: finalClearKey,
              }),
            );
          }

          const [result] = await Promise.all(promises);

          return result;
        }

        const result = await strategy.handle({
          debug: cacheManager.options.debug,
          originalMethod,
          originalMethodScope: this,
          originalMethodArgs: args,
          client,
          fallbackClient,
          forceUpdate: true,
          key: finalKey as string,
          ttl,
        });

        if (finalClearKey.length) {
          await clearStrategy.handle({
            debug: cacheManager.options.debug,
            originalMethod,
            originalMethodScope: this,
            originalMethodArgs: args,
            client,
            fallbackClient,
            key: finalClearKey,
          });
        }

        return result;
      },
    };
  };
}
