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
    const result = await this.redisClient.scan('0', 'MATCH', `*${pattern}*`, 'COUNT', 1000);

    return result ? result[1] : [];
  }
}

export const useAdapter = (client: Redis): void => {
  const ioRedisAdapter = new IoRedisAdapter(client);
  cacheManager.setClient(ioRedisAdapter);
};
