import { RedisClient, Callback } from 'redis';
import * as compareVersions from 'compare-versions';
import cacheManager, { CacheClient, parseIfRequired } from '@type-cacheable/core';

// In order to support scalars in hmsets (likely not the intended use, but support has been requested),
// we need at least one key. We can use an empty string.
const SCALAR_KEY = '';

const REDIS_VERSION_UNLINK_INTRODUCED = '4.0.0';

export class RedisAdapter implements CacheClient {
  static buildSetArgumentsFromObject = (objectValue: any): string[] =>
    Object.keys(objectValue).reduce((accum: any, objectKey: any) => {
      accum.push(objectKey, JSON.stringify(objectValue[objectKey]));

      return accum;
    }, [] as string[]);

  static transformRedisResponse = (response: any) => {
    if (response && typeof response === 'object') {
      return Object.entries(response).reduce((accum: any, curr: any[]) => {
        const [key, value] = curr;
        accum[key] = JSON.parse(value);

        return accum;
      }, {});
    }

    try {
      return JSON.parse(response);
    } catch {
      return response;
    }
  };

  static responseCallback = (resolve: Function, reject: Function): Callback<any> => (
    err: any,
    response: any,
  ) => {
    if (err) {
      reject(err);
    } else {
      if (
        response &&
        typeof response === 'object' &&
        Object.keys(response).length === 1 &&
        response[SCALAR_KEY]
      ) {
        resolve(RedisAdapter.transformRedisResponse(response)[SCALAR_KEY]);
        return;
      }

      resolve(RedisAdapter.transformRedisResponse(response));
    }
  };

  static responseScanCommandCallback = (resolve: Function, reject: Function): Callback<any> => (
    err: any,
    response: any,
  ) => {
    if (err) {
      reject(err);
    } else {
      resolve(response);
      return;
    }
  };

  // The node_redis client
  private redisClient: RedisClient;

  private clientReady: boolean = false;
  private isPingingClient: boolean = false;

  constructor(redisClient: RedisClient) {
    this.redisClient = redisClient;
    this.clientReady = this.redisClient.ping();
    this.redisClient.on('ready', () => {
      this.clientReady = true;
    });
    this.redisClient.on('error', () => {
      this.clientReady = false;
    });

    this.get = this.get.bind(this);
    this.del = this.del.bind(this);
    this.delHash = this.delHash.bind(this);
    this.getClientTTL = this.getClientTTL.bind(this);
    this.keys = this.keys.bind(this);
    this.set = this.set.bind(this);
    this.checkIfReady = this.checkIfReady.bind(this);

    this.checkIfReady();
  }

  /**
   * checkIfReady will return the last received ready status of the client.
   * If the client isn't ready, it will ping the redis client to check if it's ready
   * yet. This isn't a perfect solution, because we're not waiting for the response (so as to
   * not add latency to the underlying method calls). I believe it's a reasonable trade-off to
   * have a potential cache miss rather than add latency to all decorated method calls.
   */
  private checkIfReady(): boolean {
    if (!this.clientReady && !this.isPingingClient) {
      this.isPingingClient = true;
      this.redisClient.ping(() => {
        this.clientReady = true;
        this.isPingingClient = false;
      });
    }

    return this.clientReady;
  }

  // Redis doesn't have a standard TTL, it's at a per-key basis
  public getClientTTL(): number {
    return 0;
  }

  public async get(cacheKey: string): Promise<any> {
    const isReady = this.checkIfReady();

    if (isReady) {
      return new Promise((resolve, reject) => {
        if (cacheKey.includes(':')) {
          this.redisClient.hgetall(cacheKey, RedisAdapter.responseCallback(resolve, reject));
        } else {
          this.redisClient.get(cacheKey, RedisAdapter.responseCallback(resolve, reject));
        }
      }).then((result: any) => {
        const usableResult = parseIfRequired(result);
        if (
          usableResult &&
          typeof usableResult === 'object' &&
          Object.keys(usableResult).every((key) => Number.isInteger(Number(key)))
        ) {
          return Object.values(usableResult);
        }

        return usableResult;
      });
    }

    throw new Error('Redis client is not accepting connections.');
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
    const isReady = this.checkIfReady();

    if (isReady) {
      return new Promise((resolve, reject) => {
        if (cacheKey.includes(':')) {
          if (typeof value === 'object') {
            const args = RedisAdapter.buildSetArgumentsFromObject(value);
            this.redisClient.hmset(cacheKey, args, (err, result) => {
              if (!err) {
                // hmset doesn't add expiration by default, so we have to implement that here if ttl is given
                if (ttl) {
                  this.redisClient.expire(
                    cacheKey,
                    ttl,
                    RedisAdapter.responseCallback(resolve, reject),
                  );
                  return;
                }
              }

              RedisAdapter.responseCallback(resolve, reject)(err, result);
            });
          } else {
            this.redisClient.hmset(
              cacheKey,
              RedisAdapter.buildSetArgumentsFromObject({ [SCALAR_KEY]: JSON.stringify(value) }),
              (err, result) => {
                if (!err) {
                  // hset doesn't add expiration by default, so we have to implement that here if ttl is given
                  if (ttl) {
                    this.redisClient.expire(
                      cacheKey,
                      ttl,
                      RedisAdapter.responseCallback(resolve, reject),
                    );
                    return;
                  }
                }

                RedisAdapter.responseCallback(resolve, reject)(err, result);
              },
            );
          }
        } else {
          const usableValue = JSON.stringify(value);

          if (ttl) {
            this.redisClient.set(
              cacheKey,
              usableValue,
              'EX',
              ttl,
              RedisAdapter.responseCallback(resolve, reject),
            );
          } else {
            this.redisClient.set(
              cacheKey,
              usableValue,
              RedisAdapter.responseCallback(resolve, reject),
            );
          }
        }
      });
    }

    throw new Error('Redis client is not accepting connections.');
  }

  public async del(keyOrKeys: string | string[]): Promise<any> {
    const isReady = this.checkIfReady();

    if (isReady) {
      return new Promise((resolve, reject) => {
        if (
          compareVersions(
            this.redisClient.server_info.redis_version,
            REDIS_VERSION_UNLINK_INTRODUCED,
          ) >= 0
        ) {
          this.redisClient.unlink(keyOrKeys, RedisAdapter.responseCallback(resolve, reject));
        } else {
          this.redisClient.del(keyOrKeys, RedisAdapter.responseCallback(resolve, reject));
        }
      });
    }

    throw new Error('Redis client is not accepting connections.');
  }

  public async keys(pattern: string): Promise<string[]> {
    const isReady = this.checkIfReady();
    let keys: Array<string> = [];
    let cursor: string | null = '0';

    if (isReady) {
      while (cursor) {
        const result = (await new Promise((resolve, reject) => {
          this.redisClient.scan(
            cursor as string,
            'MATCH',
            pattern,
            'COUNT',
            '1000',
            RedisAdapter.responseScanCommandCallback(resolve, reject),
          );
        })) as [string, string[]] | undefined;

        if (result) {
          // array exists at index 1 from SCAN command, cursor is at 0
          cursor = cursor !== result[0] ? result[0] : null;
          keys = [...keys, ...result[1]];
        } else {
          cursor = null;
        }
      }

      return keys;
    }

    throw new Error('Redis client is not accepting connections.');
  }

  public async delHash(hashKeyOrKeys: string | string[]): Promise<any> {
    const finalDeleteKeys = Array.isArray(hashKeyOrKeys) ? hashKeyOrKeys : [hashKeyOrKeys];
    const isReady = this.checkIfReady();

    if (isReady) {
      const deletePromises = finalDeleteKeys.map((key) => this.keys(`*${key}*`).then(this.del));
      await Promise.all(deletePromises);
      return;
    }

    throw new Error('Redis client is not accepting connections.');
  }
}

export const useAdapter = (client: RedisClient, asFallback?: boolean): void => {
  const redisAdapter = new RedisAdapter(client);

  if (asFallback) {
    cacheManager.setFallbackClient(redisAdapter);
  } else {
    cacheManager.setClient(redisAdapter);
  }
};
