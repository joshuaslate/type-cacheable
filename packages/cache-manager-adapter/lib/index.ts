import cacheableManager, { CacheClient, CacheManagerOptions } from '@type-cacheable/core';
import * as cacheManager from 'cache-manager';

export class CacheManagerAdapter implements CacheClient {
  private client: cacheManager.Cache;

  constructor(client: cacheManager.Cache) {
    this.client = client;

    this.get = this.get.bind(this);
    this.del = this.del.bind(this);
    this.delHash = this.delHash.bind(this);
    this.getClientTTL = this.getClientTTL.bind(this);
    this.keys = this.keys.bind(this);
    this.set = this.set.bind(this);
  }

  public async del(cacheKey: string | string[]): Promise<void> {
    if (Array.isArray(cacheKey)) {
      return this.client.store.mdel(...cacheKey);
    }

    return this.client.store.del(cacheKey);
  }

  async delHash(hashKeyOrKeys: string | string[]): Promise<void> {
    const keys = Array.isArray(hashKeyOrKeys) ? hashKeyOrKeys : [hashKeyOrKeys];
    const delPromises = keys.map((key) => this.keys(key).then(this.del));

    await Promise.all(delPromises);
  }

  public async get<T>(cacheKey: string): Promise<T | undefined> {
    return this.client.get<T>(cacheKey);
  }

  public getClientTTL(): cacheManager.Milliseconds {
    return 0;
  }

  public async keys(pattern: string): Promise<string[]> {
    const keys = await this.client.store.keys(pattern);

    // If the client doesn't accept a pattern, manually implement filtering here
    if (this.client.store.keys.length > 0) {
      return keys;
    }

    try {
      const regExp = new RegExp(pattern, 'g');
      const matchedKeys = [];

      for (const key of keys) {
        if (Array.isArray(key.match(regExp))) {
          matchedKeys.push(key);
        }
      }

      return matchedKeys;
    } catch {
      console.warn(`[@type-cacheable/cache-manager-adapter]: failed to filter keys by pattern ${pattern}, returning all keys.`);
    }

    return keys;
  }

  public async set<T>(cacheKey: string, value: T, ttl?: cacheManager.Milliseconds): Promise<T> {
    await this.client.set(cacheKey, value, ttl ?? undefined);
    return value;
  }
}

export const useAdapter = (
  client: cacheManager.Cache,
  asFallback?: boolean,
  options?: CacheManagerOptions,
): CacheManagerAdapter => {
  const adapter = new CacheManagerAdapter(client);

  if (asFallback) {
    cacheableManager.setFallbackClient(adapter);
  } else {
    cacheableManager.setClient(adapter);
  }

  if (options) {
    cacheableManager.setOptions(options);
  }

  return adapter;
}
