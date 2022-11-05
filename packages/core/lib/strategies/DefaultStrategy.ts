import { CacheClient, CacheStrategy, CacheStrategyContext } from '../interfaces';

export class DefaultStrategy implements CacheStrategy {
  private pendingCacheRequestMap = new Map<string, Promise<any>>();
  private pendingMethodCallMap = new Map<string, Promise<any>>();

  private findCachedValue = async (client: CacheClient, key: string) => {
    let cachedValue: any;

    try {
      if (this.pendingCacheRequestMap.has(key)) {
        cachedValue = await this.pendingCacheRequestMap.get(key);
      } else {
        const cachePromise = client.get(key);
        this.pendingCacheRequestMap.set(key, cachePromise);
        cachedValue = await cachePromise;
      }
    } catch (err) {
      throw err;
    } finally {
      this.pendingCacheRequestMap.delete(key);
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
        } catch (fallbackErr) {}
      }

      if (context.debug) {
        console.warn(
          `type-cacheable Cacheable cache miss on method ${
            context.originalMethod.name
          } due to client error: ${(err as Error).message}`,
        );
      }
    }

    // On a cache miss, run the decorated method and cache its return value.
    let result: any;
    const pendingMethodRun = this.pendingMethodCallMap.get(context.key);

    if (pendingMethodRun) {
      result = await pendingMethodRun;
    } else {
      const methodPromise = new Promise(async (resolve, reject) => {
        let returnValue;
        try {
          returnValue = await context.originalMethod!.apply(
            context.originalMethodScope,
            context.originalMethodArgs,
          );
        } catch (err) {
          reject(err);
        }

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
              `type-cacheable Cacheable set cache failure on method ${
                context.originalMethod.name
              } due to client error: ${(err as Error).message}`,
            );
          }
        }

        resolve(returnValue);
      });

      try {
        this.pendingMethodCallMap.set(context.key, methodPromise);
        result = await methodPromise;
      } catch (err) {
        throw err;
      } finally {
        this.pendingMethodCallMap.delete(context.key);
      }
    }

    return result;
  }
}
