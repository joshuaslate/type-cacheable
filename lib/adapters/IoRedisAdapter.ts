import {Redis} from 'ioredis';
import {CacheClient} from '../interfaces';
import {fieldify, serializeValue} from "../util";
import {BasicDeserializer} from "../deserializers";

export class IoRedisAdapter implements CacheClient {

  defaultDeserializer = BasicDeserializer;

  // The node_redis client
  private redisClient: Redis;

  private clientReady: boolean = false;
  private isPingingClient: boolean = false;

  constructor(redisClient: Redis) {

    this.redisClient = redisClient;
  }

  /**
   * checkIfReady will return the last received ready status of the client.
   * If the client isn't ready, it will ping the redis client to check if it's ready
   * yet. This isn't a perfect solution, because we're not waiting for the response (so as to
   * not add latency to the underlying method calls). I believe it's a reasonable trade-off to
   * have a potential cache miss rather than add latency to all decorated method calls.
   */
  private isReady(): boolean {
    return this.redisClient.status === 'ready';
  }

  // Redis doesn't have a standard TTL, it's at a per-key basis
  public getClientTTL(): number {
    return 0;
  }

  public async get(cacheKey: string, fieldKey?: string): Promise<any> {

    if (!this.isReady()) {
      throw new Error('Redis client is not accepting connections.');
    }

    if (cacheKey.includes(':')) {
      if(fieldKey) {
        return this.redisClient.hget(cacheKey, fieldKey);
      } else {
        return this.redisClient.hgetall(cacheKey).then(res => {
          if (Object.keys(res).length === 0) {
            return null;
          } else {
            return res;
          }
        });
      }
    } else {
      return this.redisClient.get(cacheKey);
    }
  }

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

    if (!this.isReady()) {
      throw new Error('Redis client is not accepting connections.');
    }

    if (cacheKey.includes(':')) {
      let fields = fieldify(value);
      if (ttl) {
        return this.redisClient.multi().hmset(cacheKey, fields)
          .expire(cacheKey, ttl)
          .exec();
      } else {
        return this.redisClient.hmset(cacheKey, fields);
      }
    } else {
      if (ttl) {
        return this.redisClient.set(cacheKey, serializeValue(value), 'EX', ttl);
      } else {
        return this.redisClient.set(cacheKey, serializeValue(value));
      }
    }
  }


  public async del(keyOrKeys: string | string[]): Promise<any> {

    if (!this.isReady()) {
      throw new Error('Redis client is not accepting connections.');
    }

    if (typeof keyOrKeys === 'string') {
      return this.redisClient.del(keyOrKeys);
    }

    if (!keyOrKeys.length) return 0;
    return this.redisClient.del(...keyOrKeys);
  }

  public async keys(pattern: string): Promise<string[]> {

    if (!this.isReady()) {
      throw new Error('Redis client is not accepting connections.');
    }

    return this.redisClient.scan(
      '0',
      'MATCH',
      `*${pattern}*`,
      'COUNT',
      1000
      ).then(result => {
        return result ? result[1] : [];
    });
  }
}
