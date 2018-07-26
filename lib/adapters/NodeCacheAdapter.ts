import * as NodeCache from 'node-cache';
import { CacheClient } from '../interfaces';

export class NodeCacheAdapter implements CacheClient {
  static responseCallback = (resolve: Function, reject: Function): NodeCache.Callback<any> =>
  (err: any, response: any) => {
    if (err) {
      reject(err);
    } else {
      resolve(response);
    }
  };

  // The node-cache client
  private nodeCacheClient: NodeCache.NodeCache;

  constructor(nodeCacheClient: NodeCache.NodeCache) {
    this.nodeCacheClient = nodeCacheClient;
  };

  public getClientTTL(): number {
    return this.nodeCacheClient.options.stdTTL || 0;
  }

  public async get(cacheKey: string): Promise<any> {
    return new Promise((resolve, reject) => this.nodeCacheClient.get(cacheKey, NodeCacheAdapter.responseCallback(resolve, reject)));
  };

  /**
   * set - Sets a key equal to a value in a NodeCache cache
   *
   * @param cacheKey The key to store the value under
   * @param value    The value to store
   * @param ttl      Time to Live (how long, in seconds, the value should be cached)
   *
   * @returns {Promise}
   */
  public async set(cacheKey: string, value: any, ttl?: number): Promise<any> {
    if (ttl) {
      return new Promise((resolve, reject) => this.nodeCacheClient.set(cacheKey, value, ttl, NodeCacheAdapter.responseCallback(resolve, reject)));
    }

    return new Promise((resolve, reject) => this.nodeCacheClient.set(cacheKey, value, NodeCacheAdapter.responseCallback(resolve, reject)));
  };

  public async del(cacheKey: string): Promise<any> {
    return new Promise((resolve, reject) => this.nodeCacheClient.del(cacheKey, NodeCacheAdapter.responseCallback(resolve, reject)));
  };
}
