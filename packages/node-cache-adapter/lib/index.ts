import * as NodeCache from 'node-cache';
import cacheManager, { CacheClient } from '@type-cacheable/core';

export class NodeCacheAdapter implements CacheClient {
  // The node-cache client
  private nodeCacheClient: NodeCache;

  constructor(nodeCacheClient: NodeCache) {
    this.nodeCacheClient = nodeCacheClient;

    this.get = this.get.bind(this);
    this.del = this.del.bind(this);
    this.delHash = this.delHash.bind(this);
    this.getClientTTL = this.getClientTTL.bind(this);
    this.keys = this.keys.bind(this);
    this.set = this.set.bind(this);
  }

  public getClientTTL(): number {
    return this.nodeCacheClient.options.stdTTL || 0;
  }

  public async get<T>(cacheKey: string): Promise<T | undefined> {
    return this.nodeCacheClient.get<T>(cacheKey);
  }

  /**
   * set - Sets a key equal to a value in a NodeCache cache
   *
   * @param cacheKey The key to store the value under
   * @param value    The value to store
   * @param ttl      Time to Live (how long, in seconds, the value should be cached)
   *
   * @returns {Promise}
   */
  public async set<T>(cacheKey: string, value: T, ttl?: number): Promise<any> {
    if (ttl) {
      this.nodeCacheClient.set<T>(cacheKey, value, ttl);
      return;
    }

    this.nodeCacheClient.set<T>(cacheKey, value);
  }

  public async del(keyOrKeys: string | string[]): Promise<any> {
    return this.nodeCacheClient.del(keyOrKeys);
  }

  public async keys(pattern: string): Promise<string[]> {
    const allKeys = this.nodeCacheClient.keys();
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
    const finalDeleteKeys = Array.isArray(hashKeyOrKeys) ? hashKeyOrKeys : [hashKeyOrKeys];
    const deletePromises = finalDeleteKeys.map((key) => this.keys(key).then(this.del));

    await Promise.all(deletePromises);
    return;
  }
}

export const useAdapter = (client: NodeCache, asFallback?: boolean): NodeCacheAdapter => {
  const nodeCacheAdapter = new NodeCacheAdapter(client);

  if (asFallback) {
    cacheManager.setFallbackClient(nodeCacheAdapter);
  } else {
    cacheManager.setClient(nodeCacheAdapter);
  }

  return nodeCacheAdapter;
};
