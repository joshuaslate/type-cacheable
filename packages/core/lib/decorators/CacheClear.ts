import { CacheClearOptions } from '../interfaces';
import { getFinalKey, determineOp, getCacheClearStrategy, extractKey } from '../util';
import cacheManager from '../index';
import { DefaultClearStrategy } from '../strategies/DefaultClearStrategy';

/**
 * CacheClear - This decorator allows you to clear a key in
 *
 * @param options {CacheOptions}
 */
export function CacheClear(options?: CacheClearOptions) {
  return (target: Object, propertyKey: string, descriptor: PropertyDescriptor) => {
    const originalMethod = descriptor.value;

    return {
      ...descriptor,
      value: async function (...args: any[]): Promise<any> {
        try {
          // Allow a client to be passed in directly for granularity, else use the connected
          // client from the main CacheManager singleton.
          const client = options && options.client ? options.client : cacheManager.client;
          const fallbackClient =
            options && options.fallbackClient
              ? options.fallbackClient
              : cacheManager.fallbackClient;

          if (options && options.noop && determineOp(options.noop, args, this)) {
            return originalMethod!.apply(this, args);
          }

          // If there is no client, no-op is enabled (else we would have thrown before),
          // just return the result of the decorated method (no caching)
          if (!client) {
            // A caching client must exist if not set to noop, otherwise this library is doing nothing.
            if (cacheManager.options.debug) {
              console.warn(
                'type-cacheable @CacheClear was not set up with a caching client. Without a client, type-cacheable is not serving a purpose.',
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
          const clearHash = options?.hashKey && !options?.cacheKey;

          const strategy = getCacheClearStrategy(
            options?.strategy || cacheManager.options.clearStrategy || new DefaultClearStrategy(),
            args,
            contextToUse,
          );

          await strategy.handle({
            debug: cacheManager.options.debug,
            originalMethod,
            originalMethodScope: this,
            originalMethodArgs: args,
            client,
            fallbackClient,
            key: finalKey,
            isPattern: options?.isPattern,
            hashesToClear: clearHash
              ? (extractKey(options?.hashKey, args, contextToUse) as string)
              : undefined,
          });
        } catch (err) {
          if (cacheManager.options.debug) {
            console.warn(
              `type-cacheable CacheClear failed to clear cached on method ${propertyKey} value: ${err.message}`,
            );
          }
        }

        // Run the decorated method
        return originalMethod!.apply(this, args);
      },
    };
  };
}
