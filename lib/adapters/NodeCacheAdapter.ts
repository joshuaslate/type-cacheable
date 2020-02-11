import * as NodeCache from 'node-cache';
import {CacheClient} from '../interfaces';

export class NodeCacheAdapter implements CacheClient {

  defaultDeserializer = null;

  // The node-cache client
  private nodeCacheClient: NodeCache;

  constructor(nodeCacheClient: NodeCache) {
    this.nodeCacheClient = nodeCacheClient;
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
    let matchedKeys = [];
    for (let key of allKeys) {
      if (Array.isArray(key.match(regExp))) {
        matchedKeys.push(key);
      }
    }
    return matchedKeys;
  }
}
