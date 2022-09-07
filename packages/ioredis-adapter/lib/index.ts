import { Redis } from 'ioredis';
import { compareVersions } from 'compare-versions';
import cacheManager, { CacheClient, parseIfRequired } from '@type-cacheable/core';

const REDIS_VERSION_UNLINK_INTRODUCED = '4.0.0';
const REDIS_VERSION_FRAGMENT_IDENTIFIER = 'redis_version:';

export class IoRedisAdapter implements CacheClient {
  constructor(redisClient: Redis) {
    this.redisClient = redisClient;
    this.redisVersion = '0';

    this.get = this.get.bind(this);
    this.del = this.del.bind(this);
    this.delHash = this.delHash.bind(this);
    this.getClientTTL = this.getClientTTL.bind(this);
    this.keys = this.keys.bind(this);
    this.set = this.set.bind(this);

    this.init.call(this).catch();
  }

  private async init() {
    const infoString = await this.redisClient.info();
    const versionFragment = infoString
      .split('\n')
      .find((info) => info.includes(REDIS_VERSION_FRAGMENT_IDENTIFIER));
    this.redisVersion =
      versionFragment?.replace('\r', '').split(REDIS_VERSION_FRAGMENT_IDENTIFIER)[1] || '0';
  }

  private redisVersion: string = '';
  private redisClient: Redis;

  public async get(cacheKey: string): Promise<any> {
    const result = await this.redisClient.get(cacheKey);

    if (!result) {
      return null;
    }

    return parseIfRequired(result);
  }

  public async set(cacheKey: string, value: any, ttl?: number): Promise<any> {
    const usableValue = JSON.stringify(value);
    await this.redisClient.set(cacheKey, usableValue);

    if (ttl) {
      await this.redisClient.expire(cacheKey, ttl);
    }
  }

  public getClientTTL(): number {
    return 0;
  }

  public async del(keyOrKeys: string | string[]): Promise<any> {
    if (Array.isArray(keyOrKeys) && !keyOrKeys.length) {
      return 0;
    }

    const keysToDelete = Array.isArray(keyOrKeys) ? keyOrKeys : [keyOrKeys];

    if (compareVersions(this.redisVersion, REDIS_VERSION_UNLINK_INTRODUCED) >= 0) {
      return this.redisClient.unlink(...keysToDelete);
    }

    return this.redisClient.del(...keysToDelete);
  }

  public async keys(pattern: string): Promise<string[]> {
    let keys: string[] = [];
    let cursor: number | null = 0;

    while (cursor !== null) {
      const result = (await this.redisClient.scan(cursor, 'MATCH', pattern, 'COUNT', 1000)) as
        | [string, string[]]
        | undefined;

      if (result) {
        // array exists at index 1 from SCAN command, cursor is at 0
        keys = [...keys, ...result[1]];
        cursor = Number(result[0]) !== 0 ? Number(result[0]) : null;
      } else {
        cursor = null;
      }
    }

    return keys;
  }

  public async delHash(hashKeyOrKeys: string | string[]): Promise<any> {
    const finalDeleteKeys = Array.isArray(hashKeyOrKeys) ? hashKeyOrKeys : [hashKeyOrKeys];
    const deletePromises = finalDeleteKeys.map((key) => this.keys(`*${key}*`).then(this.del));

    await Promise.all(deletePromises);
    return;
  }
}

export const useAdapter = (client: Redis, asFallback?: boolean): IoRedisAdapter => {
  const ioRedisAdapter = new IoRedisAdapter(client);

  if (asFallback) {
    cacheManager.setFallbackClient(ioRedisAdapter);
  } else {
    cacheManager.setClient(ioRedisAdapter);
  }

  return ioRedisAdapter;
};
