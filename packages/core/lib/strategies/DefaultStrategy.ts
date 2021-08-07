import { CacheClient, CacheStrategy, CacheStrategyContext } from '../interfaces';

export class DefaultStrategy implements CacheStrategy {
  private pendingCacheRequestMap = new Map<string, Promise<any>>();
  private pendingMethodCallMap = new Map<string, Promise<any>>();

  private findCachedValue = async (client: CacheClient, key: string) => {
    let cachedValue: any;
    const pendingCachePromise = this.pendingCacheRequestMap.get(key);

    if (pendingCachePromise) {
      cachedValue = await pendingCachePromise;
    } else {
      const cachePromise = client.get(key);
      this.pendingCacheRequestMap.set(key, cachePromise);

      try {
        cachedValue = await cachePromise;
      } catch (e) {
        throw e;
      } finally {
        this.pendingCacheRequestMap.delete(key);
      }
    }

    return cachedValue;
  };

  async handle(context: CacheStrategyContext): Promise<any> {
    try {
      const cachedValue = await this.findCachedValue(context.client, context.key);

      // If a value for the cacheKey was found in cache, simply return that.
      if (cachedValue !== undefined && cachedValue !== null) {
        return cachedValue;
      }
    } catch (err) {
      if (context.fallbackClient) {
        try {
          const cachedValue = await this.findCachedValue(context.fallbackClient, context.key);

          // If a value for the cacheKey was found in cache, simply return that.
          if (cachedValue !== undefined && cachedValue !== null) {
            return cachedValue;
          }
        } catch (err) {}
      }

      if (context.debug) {
        console.warn(
          `type-cacheable Cacheable cache miss on method ${context.originalMethod.name} due to client error: ${err.message}`,
        );
      }
    }

    // On a cache miss, run the decorated method and cache its return value.
    let result: any;
    const pendingMethodRun = this.pendingMethodCallMap.get(context.key);

    if (pendingMethodRun) {
      result = await pendingMethodRun;
    } else {
      const methodPromise = new Promise(async (resolve) => {
        const returnValue = await context.originalMethod!.apply(
          context.originalMethodScope,
          context.originalMethodArgs,
        );

        try {
          await context.client.set(context.key, returnValue, context.ttl);
        } catch (err) {
          if (context.fallbackClient) {
            try {
              await context.fallbackClient.set(context.key, returnValue, context.ttl);
            } catch (err) {}
          }

          if (context.debug) {
            console.warn(
              `type-cacheable Cacheable set cache failure on method ${context.originalMethod.name} due to client error: ${err.message}`,
            );
          }
        }

        resolve(returnValue);
      });

      this.pendingMethodCallMap.set(context.key, methodPromise);

      result = await methodPromise;

      this.pendingMethodCallMap.delete(context.key);
    }

    return result;
  }
}
