import { CacheClient, CacheManagerOptions } from './interfaces';

export default class CacheManager {
  public client: CacheClient | null = null;
  public options: CacheManagerOptions = {
    ttlSeconds: 0,
  };
  
  public setClient(client: CacheClient): void {
    this.client = client;
  }

  public setOptions(options: CacheManagerOptions): void {
    this.options = options;
  }
}
