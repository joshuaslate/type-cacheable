import { Redis } from 'ioredis';
import cacheManager, { CacheClient, parseIfRequired } from '@type-cacheable/core';

export class IoRedisAdapter implements CacheClient {
  constructor(redisClient: Redis) {
    this.redisClient = redisClient;
  }

  private redisClient: Redis;

  public async get(cacheKey: string): Promise<any> {
    const result = await this.redisClient.get(cacheKey);

    if (!result) return null;
    return parseIfRequired(result);
  }

  public async set(cacheKey: string, value: any, ttl?: number): Promise<any> {
    const usableValue = typeof value === 'string' ? value : JSON.stringify(value);
    const ex = ttl ? ['EX', ttl] : [];
    await this.redisClient.set(cacheKey, usableValue, ex);
  }

  public getClientTTL(): number {
    return 0;
  }

  public async del(keyOrKeys: string | string[]): Promise<any> {
    if (typeof keyOrKeys === 'string') {
      return this.redisClient.del(keyOrKeys);
    }

    if (!keyOrKeys.length) return 0;
    return this.redisClient.del(...keyOrKeys);
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
        cursor = Number(result[0]) !== cursor ? Number(result[0]) : null;
      } else {
        cursor = null;
      }
    }

    return keys;
  }
}

export const useAdapter = (client: Redis, asFallback?: boolean): void => {
  const ioRedisAdapter = new IoRedisAdapter(client);

  if (asFallback) {
    cacheManager.setFallbackClient(ioRedisAdapter);
  } else {
    cacheManager.setClient(ioRedisAdapter);
  }
};
