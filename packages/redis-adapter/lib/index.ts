import { RedisClientType } from '@node-redis/client/dist/lib/client';
// import * as compareVersions from 'compare-versions';
import cacheManager, { CacheClient, parseIfRequired } from '@type-cacheable/core';

// In order to support scalars in hsets (likely not the intended use, but support has been requested),
// we need at least one key.
const SCALAR_KEY = '@TYPE-CACHEABLE-REDIS';

// const REDIS_VERSION_UNLINK_INTRODUCED = '4.0.0';

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

  static processResponse = (response: any) => {
    if (
        response &&
        typeof response === 'object' &&
        Object.keys(response).length === 1 &&
        response[SCALAR_KEY]
    ) {
      return RedisAdapter.transformRedisResponse(response)[SCALAR_KEY];
    }

    return RedisAdapter.transformRedisResponse(response);
  };

  // The node_redis client
  private redisClient: RedisClientType;
  private connectPromise: Promise<any> | null = null;
  private hasConnected: boolean = false;

  private async ensureConnection() {
    if (this.hasConnected) {
      return;
    }

    try {
      const ping = await this.redisClient.ping();

      if (ping.toLowerCase() !== 'pong') {
        throw new Error('Ping failure');
      }
    } catch {
      if (this.connectPromise) {
        return this.connectPromise;
      }

      this.connectPromise = new Promise(async (resolve, reject) => {
        try {
          const result = await this.redisClient.connect();
          this.hasConnected = true;
          resolve(result);
        } catch (err) {
          this.hasConnected = false;
          reject(err);
        } finally {
          this.connectPromise = null;
        }
      })

      return this.connectPromise;
    }
  }

  constructor(redisClient: RedisClientType) {
    this.redisClient = redisClient;

    this.get = this.get.bind(this);
    this.del = this.del.bind(this);
    this.delHash = this.delHash.bind(this);
    this.getClientTTL = this.getClientTTL.bind(this);
    this.keys = this.keys.bind(this);
    this.set = this.set.bind(this);
    this.ensureConnection = this.ensureConnection.bind(this);

    this.ensureConnection();
  }

  // Redis doesn't have a standard TTL, it's at a per-key basis
  public getClientTTL(): number {
    return 0;
  }

  public async get(cacheKey: string): Promise<any> {
    await this.ensureConnection();

    let result: any;
    if (cacheKey.includes(':')) {
      result = await this.redisClient.hGetAll(cacheKey);
    } else {
      result = await this.redisClient.get(cacheKey);
    }

    const usableResult = parseIfRequired(RedisAdapter.processResponse(result));
    if (
        usableResult &&
        typeof usableResult === 'object' &&
        Object.keys(usableResult).every((key) => Number.isInteger(Number(key)))
    ) {
      return Object.values(usableResult);
    }

    return usableResult;
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
    await this.ensureConnection();

    if (cacheKey.includes(':')) {
      if (typeof value === 'object') {
        const args = RedisAdapter.buildSetArgumentsFromObject(value);
        const result = await this.redisClient.hSet(cacheKey, args);

        if (ttl) {
          await this.redisClient.expire(cacheKey, ttl);
        }

        return RedisAdapter.processResponse(result);
      } else {
        const args = RedisAdapter.buildSetArgumentsFromObject({ [SCALAR_KEY]: JSON.stringify(value) });
        const result = await this.redisClient.hSet(cacheKey, args);

        if (ttl) {
          await this.redisClient.expire(cacheKey, ttl);
        }

        return RedisAdapter.processResponse(result);
      }
    } else {
      const usableValue = JSON.stringify(value);
      const opts: { EX?: number } = {};

      if (ttl) {
        opts.EX = ttl;
      }

      const result = await this.redisClient.set(cacheKey, usableValue, opts);

      return RedisAdapter.processResponse(result);
    }
  }

  public async del(keyOrKeys: string | string[]): Promise<any> {
    await this.ensureConnection();

    const info = await this.redisClient.info()
    console.log({ info })

    // if (
    //     compareVersions(
    //         this.redisClient.server_info.redis_version,
    //         REDIS_VERSION_UNLINK_INTRODUCED,
    //     ) >= 0
    // ) {
      const result = await this.redisClient.unlink(keyOrKeys);

    return RedisAdapter.processResponse(result);
    // } else {
    //   this.redisClient.del(keyOrKeys, RedisAdapter.responseCallback(resolve, reject));
    // }
  }

  public async keys(pattern: string): Promise<string[]> {
    await this.ensureConnection();

    let keys: Array<string> = [];
    let cursor: number | null = 0;

    while (cursor !== null) {
      const result: any = await this.redisClient.scan(
          cursor,
          {
            MATCH: pattern,
            COUNT: 1000,
          },
      );

      if (result.keys.length) {
        cursor = result.cursor;
        keys = [...keys, ...result.keys];
      } else {
        cursor = null;
      }
    }

    return keys;
  }

  public async delHash(hashKeyOrKeys: string | string[]): Promise<any> {
    const finalDeleteKeys = Array.isArray(hashKeyOrKeys) ? hashKeyOrKeys : [hashKeyOrKeys];
    await this.ensureConnection();

    const deletePromises = finalDeleteKeys.map((key) => this.keys(`*${key}*`).then(this.del));
    await Promise.all(deletePromises);
  }
}

export const useAdapter = (client: RedisClientType, asFallback?: boolean): RedisAdapter => {
  const redisAdapter = new RedisAdapter(client);

  if (asFallback) {
    cacheManager.setFallbackClient(redisAdapter);
  } else {
    cacheManager.setClient(redisAdapter);
  }

  return redisAdapter;
};
