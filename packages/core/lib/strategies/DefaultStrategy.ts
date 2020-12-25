import { CacheStrategy, CacheStrategyContext } from '../interfaces';
import { Observable, isObservable } from 'rxjs';


export class DefaultStrategyEx implements CacheStrategy {
  async handle(context: CacheStrategyContext): Promise<any> {
    try {
      const cachedValue = await context.client.get(context.key);

      // If a value for the cacheKey was found in cache, simply return that.
      if (cachedValue !== undefined && cachedValue !== null) {
        return cachedValue;
      }
    } catch (err) {
      if (context.fallbackClient) {
        try {
          const cachedValue = await context.fallbackClient.get(context.key);

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
    const resultOrDeffered = context.originalMethod!.apply(
      context.originalMethodScope,
      context.originalMethodArgs,
    );

    // Check return type
    let resultPromise: Promise<any>;
    if (resultOrDeffered instanceof Promise) {
      resultPromise = resultOrDeffered as Promise<any>;
    } else if (isObservable(resultOrDeffered)) {
      resultPromise = (resultOrDeffered as Observable<any>).toPromise();
    }
    else {
      resultPromise =  Promise.resolve(resultOrDeffered);
    }

    const result = await resultPromise;


    try {
      await context.client.set(context.key, result, context.ttl);
    } catch (err) {
      if (context.fallbackClient) {
        try {
          await context.fallbackClient.set(context.key, result, context.ttl);
        } catch (err) {}
      }

      if (context.debug) {
        console.warn(
          `type-cacheable Cacheable set cache failure on method ${context.originalMethod.name} due to client error: ${err.message}`,
        );
      }
    }

    return result;
  }
}