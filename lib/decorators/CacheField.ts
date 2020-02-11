import {CacheOptions} from '../interfaces';
import {determineOp, getFinalKey, getTTL} from '../util';
import cacheManager from '../index';

/**
 * CacheField - This decorator allows you to return a field only of an hashed key.
 * In case of a cache miss the decorated method is executed.
 *
 * @param options {CacheOptions}
 */
export function CacheField(options?: CacheOptions) {
  return (target: Object, propertyKey: string, descriptor: PropertyDescriptor) => {
    return {
      ...descriptor,
      value: async function(...args: any[]): Promise<any> {
        // Allow a client to be passed in directly for granularity, else use the connected
        // client from the main CacheManager singleton.
        const client = options && options.client
          ? options.client
          : cacheManager.client;

        // If there is no client, no-op is enabled (else we would have thrown before),
        // just return the result of the decorated method (no caching)
        if (!client) {
          if (options && options.noop && determineOp(options.noop, args, this)) {
            return descriptor.value!.apply(this, args);
          }

          // A caching client must exist if not set to noop, otherwise this library is doing nothing.
          if (cacheManager.options.debug) {
            console.warn('type-cacheable @Cacheable was not set up with a caching client. Without a client, type-cacheable is not serving a purpose.');
          }

          return descriptor.value!.apply(this, args);
        }

        const contextToUse = !cacheManager.options.excludeContext
          ? this
          : undefined;
        const finalKey = getFinalKey(options && options.cacheKey, options && options.hashKey, propertyKey, args, contextToUse);
        const fieldKey = options && options.fieldKey ? typeof options.fieldKey === 'string' ? options.fieldKey : options.fieldKey(args, contextToUse) : null;
        try {
          const cachedValue = fieldKey ? await client.get(finalKey, fieldKey) : await client.get(finalKey);

          // If a value for the cacheKey was found in cache, simply return that.
	      if (cachedValue !== undefined && cachedValue !== null) {

	        if(options && options.deserializer !== false) {
	          if(typeof options.deserializer === 'function') {
                return options.deserializer(cachedValue);
              } else if(client.defaultDeserializer !== null) {
	              return client.defaultDeserializer(cachedValue);
              }
            } else {
              return cachedValue;
            }
          }
        } catch (err) {
          if (cacheManager.options.debug) {
            console.warn(`type-cacheable Cacheable cache miss due to client error: ${err.message}`);
          }
        }

        // On a cache miss, run the decorated function
        const result = await descriptor.value!.apply(this, args);


        return result;
      },
    };
  };
};
