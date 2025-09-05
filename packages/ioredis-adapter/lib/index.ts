import cacheManager, {
  type CacheClient,
  type CacheManagerOptions,
  parseIfRequired,
} from '@type-cacheable/core';
import { Cluster, type Redis } from 'ioredis';

export class IoRedisAdapter implements CacheClient {
  constructor(redisClient: Redis | Cluster) {
    this.redisClient = redisClient;
    if (this.redisClient.options.keyPrefix) {
      this.keyPrefixRe = new RegExp(`^${this.redisClient.options.keyPrefix}`);
    }

    this.get = this.get.bind(this);
    this.del = this.del.bind(this);
    this.delHash = this.delHash.bind(this);
    this.getClientTTL = this.getClientTTL.bind(this);
    this.keys = this.keys.bind(this);
    this.set = this.set.bind(this);

    this.init.call(this).catch();
  }

  private async init() {
    const res = await this.redisClient.command('INFO', 'UNLINK');
    this.supportsUnlink = Boolean(res?.length);
  }

  private keyPrefixRe?: RegExp;
  private supportsUnlink = true;
  private readonly redisClient: Redis | Cluster;

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

    if (this.supportsUnlink) {
      return this.redisClient.unlink(...keysToDelete);
    }

    return this.redisClient.del(...keysToDelete);
  }

  public async keys(pattern: string): Promise<string[]> {
    if (this.redisClient instanceof Cluster) {
      const cluster = this.redisClient as Cluster;
      const keys = cluster
        .nodes('master')
        .map((node) => this.scanKeys(node, pattern));
      return (await Promise.all(keys)).flat();
    }

    return this.scanKeys(this.redisClient, pattern);
  }

  private async scanKeys(
    client: Redis | Cluster,
    pattern: string,
  ): Promise<string[]> {
    let cursor: number | null = 0;
    let keys: string[] = [];
    while (cursor !== null) {
      const result = (await client.scan(
        cursor,
        'MATCH',
        pattern,
        'COUNT',
        1000,
      )) as [string, string[]] | undefined;

      if (result) {
        // array exists at index 1 from SCAN command, cursor is at 0
        keys = [...keys, ...result[1]];
        cursor = Number(result[0]) !== 0 ? Number(result[0]) : null;
      } else {
        cursor = null;
      }
    }
    return this.keyPrefixRe
      ? keys.map((key) => key.replace(this.keyPrefixRe!, ''))
      : keys;
  }

  public async delHash(hashKeyOrKeys: string | string[]): Promise<any> {
    const finalDeleteKeys = Array.isArray(hashKeyOrKeys)
      ? hashKeyOrKeys
      : [hashKeyOrKeys];
    const deletePromises = finalDeleteKeys.map((key) =>
      this.keys(`*${key}*`).then(this.del),
    );

    await Promise.all(deletePromises);
    return;
  }
}

export const useAdapter = (
  client: Redis | Cluster,
  asFallback?: boolean,
  options?: CacheManagerOptions,
): IoRedisAdapter => {
  const ioRedisAdapter = new IoRedisAdapter(client);

  if (asFallback) {
    cacheManager.setFallbackClient(ioRedisAdapter);
  } else {
    cacheManager.setClient(ioRedisAdapter);
  }

  if (options) {
    cacheManager.setOptions(options);
  }

  return ioRedisAdapter;
};
