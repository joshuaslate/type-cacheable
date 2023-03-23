import LRUCache from 'lru-cache';
import cacheManager, { CacheClient } from '@type-cacheable/core';

export class LRUCacheAdapter<T extends {}> implements CacheClient {
  constructor(lruClient: LRUCache<string, T>) {
    this.lruClient = lruClient;

    this.get = this.get.bind(this);
    this.del = this.del.bind(this);
    this.delHash = this.delHash.bind(this);
    this.getClientTTL = this.getClientTTL.bind(this);
    this.keys = this.keys.bind(this);
    this.set = this.set.bind(this);
  }

  private lruClient: LRUCache<string, T>;

  public async get(cacheKey: string): Promise<any> {
    return Promise.resolve(this.lruClient.get(cacheKey));
  }

  public async set(cacheKey: string, value: any, ttl?: number): Promise<any> {
    // the lru-cache takes ttl in ms instead of seconds, so convert seconds to ms
    return Promise.resolve(
      this.lruClient.set(cacheKey, value as T, ttl ? {
        ttl: ttl * 1000,
      } : undefined)
    );
  }

  public getClientTTL(): number {
    try {
      return this.lruClient.ttl / 1000;
    } catch {
      return 0;
    }
  }

  public async del(keyOrKeys: string | string[]): Promise<any> {
    if (Array.isArray(keyOrKeys)) {
      keyOrKeys.forEach((key) => {
        this.lruClient.delete(key);
      });

      return keyOrKeys.length;
    }

    this.lruClient.delete(keyOrKeys);
    return 1;
  }

  public async keys(pattern: string): Promise<string[]> {
    const allKeys = this.lruClient.keys();
    const regExp = new RegExp(pattern, 'g');
    const matchedKeys = [];

    for (const key of allKeys) {
      if (Array.isArray(key.match(regExp))) {
        matchedKeys.push(key);
      }
    }

    return matchedKeys;
  }

  public async delHash(hashKeyOrKeys: string | string[]): Promise<any> {
    const finalDeleteKeys = Array.isArray(hashKeyOrKeys)
      ? hashKeyOrKeys
      : [hashKeyOrKeys];
    const deletePromises = finalDeleteKeys.map((key) =>
      this.keys(key).then(this.del)
    );

    await Promise.all(deletePromises);
    return;
  }
}

export const useAdapter = <T extends {} = {}>(
  client: LRUCache<string, T>,
  asFallback?: boolean
): LRUCacheAdapter<T> => {
  const lruCacheAdapter = new LRUCacheAdapter(client);

  if (asFallback) {
    cacheManager.setFallbackClient(lruCacheAdapter);
  } else {
    cacheManager.setClient(lruCacheAdapter);
  }
  return lruCacheAdapter;
};
