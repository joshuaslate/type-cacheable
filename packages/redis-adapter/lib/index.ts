import cacheManager, {
  type CacheClient,
  type CacheManagerOptions,
  parseIfRequired,
} from '@type-cacheable/core';
import type { RedisClientType, RedisClusterType } from 'redis';

// In order to support scalars in hsets (likely not the intended use, but support has been requested),
// we need at least one key.
const SCALAR_KEY = '@TYPE-CACHEABLE-REDIS';

const REDIS_SCAN_PAGE_LIMIT = 1000;

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
        accum[key] = parseIfRequired(value);

        return accum;
      }, {});
    }

    try {
      return parseIfRequired(response);
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

  private redisClient: RedisClientType<any> | RedisClusterType<any>;
  private connectPromise: Promise<any> | null = null;
  private hasConnected: boolean = false;
  private supportsUnlink: boolean = true;

  private async ensureConnection() {
    if (this.hasConnected) {
      return;
    }

    if ('isReady' in this.redisClient) {
      if (this.redisClient.isReady) {
        this.hasConnected = true;
        return;
      }

      return;
    }

    if ('masters' in this.redisClient) {
      const masters = this.redisClient.masters;

      for (const node of masters) {
        const client = await node.client;
        if (client && 'isReady' in client && client.isReady) {
          this.hasConnected = true;
          return;
        }
      }
    }

    if (this.connectPromise) {
      return this.connectPromise;
    }

    this.connectPromise = new Promise((resolve, reject) => {
      this.redisClient
        .connect()
        .then((result) => {
          if (result) {
            this.hasConnected = true;
            resolve(result);
          } else {
            this.hasConnected = false;
            reject('Redis connection could not be established');
          }
        })
        .catch((e) => {
          this.hasConnected = false;
          reject(e);
        })
        .finally(() => {
          this.connectPromise = null;
        });
    });

    return this.connectPromise;
  }

  constructor(redisClient: RedisClientType<any> | RedisClusterType<any>) {
    this.redisClient = redisClient;

    this.get = this.get.bind(this);
    this.del = this.del.bind(this);
    this.delHash = this.delHash.bind(this);
    this.getClientTTL = this.getClientTTL.bind(this);
    this.keys = this.keys.bind(this);
    this.set = this.set.bind(this);
    this.ensureConnection = this.ensureConnection.bind(this);
    this.updateUnlinkSupport = this.updateUnlinkSupport.bind(this);

    this.ensureConnection()
      .then(() => this.updateUnlinkSupport())
      .catch();
  }

  private async updateUnlinkSupport() {
    try {
      if ('masters' in this.redisClient) {
        const masters = this.redisClient.masters;

        const results = await Promise.all(
          masters.map(async (node) => {
            try {
              const client = await node.client;
              if (client) {
                const res = await client.sendCommand([
                  'COMMAND',
                  'INFO',
                  'UNLINK',
                ]);
                return Boolean(res);
              }
            } catch {
              return false;
            }
          }),
        );

        this.supportsUnlink = results.every(Boolean);
      } else {
        const res = await this.redisClient.sendCommand([
          'COMMAND',
          'INFO',
          'UNLINK',
        ]);
        this.supportsUnlink = Boolean(res);
      }
    } catch (e) {
      console.warn(
        '[type-cacheable]: error encountered while testing unlink support:',
        e,
      );
    }
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
        const args = RedisAdapter.buildSetArgumentsFromObject({
          [SCALAR_KEY]: JSON.stringify(value),
        });
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

    if (this.supportsUnlink) {
      const result = await this.redisClient.unlink(keyOrKeys);
      return RedisAdapter.processResponse(result);
    } else {
      const result = await this.redisClient.del(keyOrKeys);
      return RedisAdapter.processResponse(result);
    }
  }

  private async scan(
    client: RedisClientType<any>,
    pattern: string,
  ): Promise<string[]> {
    const keys: Set<string> = new Set();
    let cursor: number | null = 0;

    while (cursor !== null) {
      const response: { cursor: number; keys: string[] } = await client.scan(
        cursor,
        {
          MATCH: pattern,
          COUNT: REDIS_SCAN_PAGE_LIMIT,
        },
      );

      cursor = response.cursor || null;

      for (const k of response.keys || []) {
        keys.add(k);
      }
    }

    return Array.from(keys);
  }

  public async keys(pattern: string): Promise<string[]> {
    await this.ensureConnection();

    const scanPromises: Promise<string[]>[] = [];

    if ('scan' in this.redisClient) {
      scanPromises.push(this.scan(this.redisClient, pattern));
    } else if ('masters' in this.redisClient) {
      const masters = this.redisClient.masters;

      for (const node of masters) {
        const nodeClient = await this.redisClient.nodeClient(node);
        if (nodeClient) {
          scanPromises.push(this.scan(nodeClient, pattern));
        }
      }
    }

    const keys = new Set<string>();

    const scanResults = await Promise.all(scanPromises);

    for (const scanResult of scanResults) {
      for (const resultKeys of scanResult) {
        keys.add(resultKeys);
      }
    }

    return Array.from(keys);
  }

  public async delHash(hashKeyOrKeys: string | string[]): Promise<any> {
    const finalDeleteKeys = Array.isArray(hashKeyOrKeys)
      ? hashKeyOrKeys
      : [hashKeyOrKeys];
    await this.ensureConnection();

    const deletePromises = finalDeleteKeys.map((key) =>
      this.keys(`*${key}*`).then(this.del),
    );
    await Promise.all(deletePromises);
  }
}

export const useAdapter = (
  client: RedisClientType<any> | RedisClusterType<any>,
  asFallback?: boolean,
  options?: CacheManagerOptions,
): RedisAdapter => {
  const redisAdapter = new RedisAdapter(client);

  if (asFallback) {
    cacheManager.setFallbackClient(redisAdapter);
  } else {
    cacheManager.setClient(redisAdapter);
  }

  if (options) {
    cacheManager.setOptions(options);
  }

  return redisAdapter;
};
