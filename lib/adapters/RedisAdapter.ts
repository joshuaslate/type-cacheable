import { RedisClient, Callback } from 'redis';
import { CacheClient } from '../interfaces';
import { parseIfRequired, getSeparatedKeys } from '../util';

export class RedisAdapter implements CacheClient {
  static expiresAtProperty = 'expiresAt';

  /**
   * getExpiresAtKey - For hashsets, we need to store a separate value for expiration, so this
   *                   static method generates the key name for the expiration
   */
  static getExpiresAtKey = (cacheKey: string): string => `${cacheKey}_${RedisAdapter.expiresAtProperty}`;

  static responseCallback = (resolve: Function, reject: Function): Callback<any> =>
  (err: any, response: any) => {
    if (err) {
      reject(err);
    } else {
      resolve(response);
    }
  };

  // The node_redis client
  private redisClient: RedisClient;

  constructor(redisClient: RedisClient) {
    this.redisClient = redisClient;
  };

  // Redis doesn't have a standard TTL, it's at a per-key basis
  public getClientTTL(): number {
    return 0;
  }

  public async get(cacheKey: string): Promise<any> {
    const separatedKeys = getSeparatedKeys(cacheKey);
    let hashKey: string;
    let individualKey: string;
    let expirationKey: string;

    if (separatedKeys) {
      [ hashKey, individualKey ] = separatedKeys;
      expirationKey = RedisAdapter.getExpiresAtKey(individualKey);
    }

    return new Promise((resolve, reject) => {
      if (separatedKeys) {
        this.redisClient.hmget(hashKey, [individualKey, expirationKey], RedisAdapter.responseCallback(resolve, reject));
      } else {
        this.redisClient.get(cacheKey, RedisAdapter.responseCallback(resolve, reject));
      }
    }).then((result: any) => {
      if (result) {
        const usableResult = parseIfRequired(result);

        if (separatedKeys && Array.isArray(usableResult)) {
          // hget will return in the order we query keys from Redis in (value first, then expiration)
          const [ innerResult, expiration ]: any[] = usableResult;
          const expiresAt = expiration
            ? Number(expiration)
            : null;

          // If there is no expiresAt value, or if the hash hasn't expired,
          // return the parsed result. Else return null and repopulate the cache.
          return !expiresAt || (expiresAt && expiresAt < (Date.now() / 1000))
            ? innerResult && parseIfRequired(innerResult)
            : null;
        }

        return usableResult;
      }

      return result;
    });
  };

  /**
   * set - Sets a key equal to a value in a Redis cache
   *
   * @param cacheKey The key to store the value under
   * @param value    The value to store
   * @param ttl      Time to Live (how long, in seconds, the value should be cached)
   *
   * @returns {Promise}
   */
  public async set(cacheKey: string, value: any, ttl?: number): Promise<any> {
    const usableValue = typeof value === 'object'
     ? JSON.stringify(value)
     : value;

    const separatedKeys = getSeparatedKeys(cacheKey);

    return new Promise((resolve, reject) => {
      if (separatedKeys) {
        const [ hashKey, individualKey ]: string[] = separatedKeys;
        const args: any[] = [individualKey, usableValue];

        // hmset doesn't add expiration by default, so we have to implement that here if ttl is given
        if (ttl) {
          args.push(RedisAdapter.getExpiresAtKey(individualKey), (Date.now() / 1000) + ttl);
        }

        this.redisClient.hmset(hashKey, args, RedisAdapter.responseCallback(resolve, reject));
      } else {
        if (ttl) {
          this.redisClient.set(cacheKey, usableValue, 'EX', ttl, RedisAdapter.responseCallback(resolve, reject));
        } else {
          this.redisClient.set(cacheKey, usableValue, RedisAdapter.responseCallback(resolve, reject));
        }
      }
    });
  };

  public async del(cacheKey: string): Promise<any> {
    const separatedKeys = getSeparatedKeys(cacheKey);
    return new Promise((resolve, reject) => {
      // Handle hash deletes
      if (separatedKeys) {
        const [ hashKey, individualKey ]: string[] = separatedKeys;
        this.redisClient.hdel(hashKey, [individualKey, RedisAdapter.getExpiresAtKey(individualKey)], RedisAdapter.responseCallback(resolve, reject));
      // Handle deletes on normal keys
      } else {
        this.redisClient.del(cacheKey, RedisAdapter.responseCallback(resolve, reject));
      }
    });
  };
}
