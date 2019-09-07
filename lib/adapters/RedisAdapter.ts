import { RedisClient, Callback } from 'redis';
import { CacheClient } from '../interfaces';
import { parseIfRequired } from '../util';

export class RedisAdapter implements CacheClient {
  static buildSetArgumentsFromObject = (objectValue: any): string[] =>
    Object.keys(objectValue).reduce((accum: any, curr: any) => {
      accum.push(curr, typeof objectValue[curr] === 'object' ? JSON.stringify(objectValue[curr]) : objectValue[curr]);

      return accum;
    }, [] as string[]);

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
    return new Promise((resolve, reject) => {
      if (cacheKey.includes(':')) {
        this.redisClient.hgetall(cacheKey, RedisAdapter.responseCallback(resolve, reject));
      } else {
        this.redisClient.get(cacheKey, RedisAdapter.responseCallback(resolve, reject));
      }
    }).then((result: any) => {
      const usableResult = parseIfRequired(result);
      if (usableResult && typeof usableResult === 'object' && Object.keys(usableResult).every(key => Number.isInteger(Number(key)))) {
        return Object.keys(usableResult).map(key => parseIfRequired(usableResult[key]));
      }

      return usableResult;
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
    return new Promise((resolve, reject) => {
      if (cacheKey.includes(':') && typeof value === 'object') {
        const args = RedisAdapter.buildSetArgumentsFromObject(value);

        this.redisClient.hmset(cacheKey, args, (err, result) => {
          if (!err) {
            // hmset doesn't add expiration by default, so we have to implement that here if ttl is given
            if (ttl) {
              this.redisClient.expire(cacheKey, ttl, RedisAdapter.responseCallback(resolve, reject));
              return;
            }
          }

          RedisAdapter.responseCallback(resolve, reject)(err, result);
        });
      } else {
        const usableValue = typeof value === 'string' ? value : JSON.stringify(value);

        if (ttl) {
          this.redisClient.set(cacheKey, usableValue, 'EX', ttl, RedisAdapter.responseCallback(resolve, reject));
        } else {
          this.redisClient.set(cacheKey, usableValue, RedisAdapter.responseCallback(resolve, reject));
        }
      }
    })
  };

  public async del(cacheKey: string): Promise<any> {
    return new Promise((resolve, reject) => {
      this.redisClient.del(cacheKey, RedisAdapter.responseCallback(resolve, reject));
    });
  };
}
