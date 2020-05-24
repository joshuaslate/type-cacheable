import { CacheStrategy, CacheStrategyContext } from '../interfaces'; 

export class DefaultStrategy implements CacheStrategy {
  async handle(context: CacheStrategyContext): Promise<any> {
    try {
      const cachedValue = await context.client.get(context.key);

      // If a value for the cacheKey was found in cache, simply return that.
    if (cachedValue !== undefined && cachedValue !== null) {
        return cachedValue;
      }
    } catch (err) {
      if (context.debug) {
        console.warn(`type-cacheable Cacheable cache miss due to client error: ${err.message}`);
      }
    }

    // On a cache miss, run the decorated function and cache its return value.
    const result = await context.origianlFunction!.apply(context.originalFunctionScope, context.originalFunctionArgs);

    try {
      await context.client.set(context.key, result, context.ttl);
    } catch (err) {
      if (context.debug) {
        console.warn(`type-cacheable Cacheable set cache failure due to client error: ${err.message}`);
      }
    }

    return result;
  }
}
