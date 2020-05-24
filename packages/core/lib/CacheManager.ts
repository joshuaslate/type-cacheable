import { CacheClient, CacheManagerOptions } from './interfaces';
import { DefaultStrategy } from './strategies';

export default class CacheManager {
  public client: CacheClient | null = null;
  public options: CacheManagerOptions = {
    excludeContext: true,
    ttlSeconds: 0,
    debug: false,
    strategy: new DefaultStrategy(),
  };

  public setClient(client: CacheClient): void {
    this.client = client;

    if (this.options && !this.options.ttlSeconds) {
      this.options.ttlSeconds = this.client.getClientTTL();
    }
  }

  public setOptions(options: CacheManagerOptions): void {
    this.options = options;
  }
}
