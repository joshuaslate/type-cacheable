import { CacheUpdateOptions, CacheUpdateStrategyContext } from '../interfaces';
import {
  determineOp,
  getFinalKey,
  getTTL,
  getCacheClearStrategy,
  getCacheUpdateStrategy,
} from '../util';
import cacheManager from '../index';
import { DefaultClearStrategy } from '../strategies/DefaultClearStrategy';
import { DefaultUpdateStrategy } from '../strategies/DefaultUpdateStrategy';

/**
 * CacheUpdate - This decorator allows you to update a cached value
 *
 * @param options {CacheUpdateOptions}
 */
export function CacheUpdate(options?: CacheUpdateOptions) {
  return (target: Object, propertyKey: string, descriptor?: PropertyDescriptor) => {
    const originalMethod = descriptor?.value;

    return {
      ...descriptor,
      value: async function (...args: any[]): Promise<any> {
        // Allow a client to be passed in directly for granularity, else use the connected
        // client from the main CacheManager singleton.
        const client = options && options.client ? options.client : cacheManager.client;
        const fallbackClient =
          options && options.fallbackClient ? options.fallbackClient : cacheManager.fallbackClient;

        if (options && options.noop && determineOp(options.noop, args, this)) {
          return originalMethod?.apply(this, args);
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

          return originalMethod?.apply(this, args);
        }

        const result = await originalMethod?.apply(this, args);
        const contextToUse = !cacheManager.options.excludeContext ? this : undefined;

        const finalKey = getFinalKey(
          options && options.cacheKey,
          options && options.hashKey,
          propertyKey,
          args,
          contextToUse,
          result,
        );

        // TTL in seconds should prioritize options set in the decorator first,
        // the CacheManager options second, and be undefined if unset.
        const ttl =
          options && options.ttlSeconds
            ? getTTL(options.ttlSeconds, args, contextToUse)
            : cacheManager.options.ttlSeconds || undefined;

        const strategy = getCacheUpdateStrategy(
          options?.strategy || cacheManager.options.updateStrategy || new DefaultUpdateStrategy(),
          args,
          contextToUse,
          result,
        );

        const finalClearKey = options?.cacheKeysToClear === null ? undefined : getFinalKey(
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

        const cacheParams: CacheUpdateStrategyContext = {
          debug: cacheManager.options.debug,
          originalMethod,
          originalMethodScope: this,
          originalMethodArgs: args,
          originalPropertyKey: propertyKey,
          client,
          fallbackClient,
          key: finalKey as string,
          ttl,
          result,
        };

        const clearParams = finalClearKey?.length ? {
          debug: cacheManager.options.debug,
          originalMethod,
          originalMethodScope: this,
          originalMethodArgs: args,
          originalPropertyKey: propertyKey,
          client,
          fallbackClient,
          key: finalClearKey,
        } : undefined;

        if (options?.clearAndUpdateInParallel) {
          const promises = [strategy.handle(cacheParams)];

          if (clearParams) {
            promises.push(clearStrategy.handle(clearParams));
          }

          const [strategyResult] = await Promise.all(promises);

          return strategyResult;
        }

        const strategyResult = await strategy.handle(cacheParams);

        if (clearParams) {
          await clearStrategy.handle(clearParams);
        }

        return strategyResult;
      },
    };
  };
}
