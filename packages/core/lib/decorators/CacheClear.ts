import { CacheClearOptions } from '../interfaces';
import { getFinalKey, determineOp, getCacheClearStrategy, extractKey, setMetadata } from '../util';
import cacheManager from '../index';
import { DefaultClearStrategy } from '../strategies/DefaultClearStrategy';
import { getCacheClient } from '../util/getCacheClient';

/**
 * CacheClear - This decorator allows you to clear a key in
 *
 * @param options {CacheOptions}
 */
export function CacheClear(options?: CacheClearOptions) {
  return (target: Object, propertyKey: string, descriptor?: PropertyDescriptor) => {
    const originalMethod = descriptor?.value;
    const defaultStrategy = new DefaultClearStrategy();

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
              'type-cacheable @CacheClear was not set up with a caching client. Without a client, type-cacheable is not serving a purpose.',
            );
          }

          return originalMethod?.apply(this, args);
        }

        // Run the decorated method
        const result = await originalMethod?.apply(this, args);

        try {
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
          const clearHash = options?.hashKey && !options?.cacheKey;

          const strategy = getCacheClearStrategy(
            options?.strategy || cacheManager.options.clearStrategy || defaultStrategy,
            args,
            contextToUse,
          );

          await strategy.handle({
            debug: cacheManager.options.debug,
            originalMethod,
            originalPropertyKey: propertyKey,
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
              `type-cacheable CacheClear failed to clear cached on method ${propertyKey} value: ${
                (err as Error).message
              }`,
            );
          }
        }

        return result;
      },
    };

    setMetadata(newDescriptor, originalMethod);
    return newDescriptor;
  };
}
