import { RedisClientType } from '@redis/client/dist/lib/client';
import { compareVersions } from 'compare-versions';
import cacheManager, { CacheClient, parseIfRequired } from '@type-cacheable/core';

// In order to support scalars in hsets (likely not the intended use, but support has been requested),
// we need at least one key.
const SCALAR_KEY = '@TYPE-CACHEABLE-REDIS';

const REDIS_VERSION_UNLINK_INTRODUCED = '4.0.0';
const REDIS_VERSION_FRAGMENT_IDENTIFIER = 'redis_version:';
const REDIS_SCAN_PAGE_LIMIT = 1000;

const dateFormat = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{1,3}Z$/
const fixDates = (key: string, value: any) => {
  if (typeof value === 'string' && dateFormat.test(value)) {
    return new Date(value)
  }
  return value
}


export interface RedisAdapterOptions {
  ignoreConnectionErrors?: boolean;
}

const defaultOptions: RedisAdapterOptions = {
  ignoreConnectionErrors: false,
}

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
        accum[key] = JSON.parse(value, fixDates);

        return accum;
      }, {});
    }

    try {
      return JSON.parse(response, fixDates);
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
  private options: RedisAdapterOptions;
  private connectPromise: Promise<any> | null = null;
  private hasConnected: boolean = false;
  private redisVersion: string | undefined;

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

  constructor(redisClient: RedisClientType, options: RedisAdapterOptions = defaultOptions) {
    this.redisClient = redisClient;
    this.options = options;

    this.get = this.get.bind(this);
    this.del = this.del.bind(this);
    this.delHash = this.delHash.bind(this);
    this.getClientTTL = this.getClientTTL.bind(this);
    this.keys = this.keys.bind(this);
    this.set = this.set.bind(this);
    this.ensureConnection = this.ensureConnection.bind(this);

    this.ensureConnection().then(() => {
      this.redisClient.info().then(infoString => {
        const versionFragment = infoString
          .split('\n')
          .find((info) => info.includes(REDIS_VERSION_FRAGMENT_IDENTIFIER));
        this.redisVersion =
          versionFragment?.replace('\r', '').split(REDIS_VERSION_FRAGMENT_IDENTIFIER)[1] || '0';
      }).catch();
    }).catch();
  }
  // Redis doesn't have a standard TTL, it's at a per-key basis
  public getClientTTL(): number {
    return 0;
  }

  public async get(cacheKey: string): Promise<any> {
    try {
      await this.ensureConnection();
    } catch (err) {
      if (this.options.ignoreConnectionErrors) {
        return;
      }

      // If there was a connection error, and they're not being ignored, re-throw
      throw err;
    }

    let result: any;
    if (cacheKey.includes(':')) {
      result = await this.redisClient.hGetAll(cacheKey);
    } else {
      result = await this.redisClient.get(cacheKey);
    }

    if (!result || (!result.toString && JSON.stringify(result) === '{}')) {
      return null;
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
    try {
      await this.ensureConnection();
    } catch (err) {
      if (this.options.ignoreConnectionErrors) {
        return;
      }

      // If there was a connection error, and they're not being ignored, re-throw
      throw err;
    }

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
    try {
      await this.ensureConnection();
    } catch (err) {
      if (this.options.ignoreConnectionErrors) {
        return;
      }

      // If there was a connection error, and they're not being ignored, re-throw
      throw err;
    }

    if (
        this.redisVersion &&
        compareVersions(
            this.redisVersion,
            REDIS_VERSION_UNLINK_INTRODUCED,
        ) >= 0
    ) {
      const result = await this.redisClient.unlink(keyOrKeys);
      return RedisAdapter.processResponse(result);
    } else {
      const result = await this.redisClient.del(keyOrKeys);
      return RedisAdapter.processResponse(result);
    }
  }

  public async keys(pattern: string): Promise<string[]> {
    try {
      await this.ensureConnection();
    } catch (err) {
      if (this.options.ignoreConnectionErrors) {
        return [];
      }

      // If there was a connection error, and they're not being ignored, re-throw
      throw err;
    }

    const keys: string[] = [];
    let cursor: number | null = 0;

    while (cursor !== null) {
      const { cursor: responseCursor, keys: responseKeys = [] }: { cursor: number, keys: string[] } = await this.redisClient.scan(cursor, {
        MATCH: pattern,
        COUNT: REDIS_SCAN_PAGE_LIMIT,
      });

      cursor = responseCursor || null;
      keys.push(...responseKeys);
    }

    return keys;
  }

  public async delHash(hashKeyOrKeys: string | string[]): Promise<any> {
    const finalDeleteKeys = Array.isArray(hashKeyOrKeys) ? hashKeyOrKeys : [hashKeyOrKeys];

    try {
      await this.ensureConnection();
    } catch (err) {
      if (this.options.ignoreConnectionErrors) {
        return;
      }

      // If there was a connection error, and they're not being ignored, re-throw
      throw err;
    }

    const deletePromises = finalDeleteKeys.map((key) => this.keys(`*${key}*`).then(this.del));
    await Promise.all(deletePromises);
  }
}

export const useAdapter = (client: RedisClientType, asFallback?: boolean, options?: RedisAdapterOptions): RedisAdapter => {
  const redisAdapter = new RedisAdapter(client, options);

  if (asFallback) {
    cacheManager.setFallbackClient(redisAdapter);
  } else {
    cacheManager.setClient(redisAdapter);
  }

  return redisAdapter;
};
