import { CacheClient, CacheManagerOptions } from './interfaces';
import { DefaultStrategy } from './strategies';
import { DefaultClearStrategy } from './strategies/DefaultClearStrategy';

export default class CacheManager {
  public client: CacheClient | null = null;
  public fallbackClient: CacheClient | null = null;
  public options: CacheManagerOptions = {
    excludeContext: true,
    ttlSeconds: 0,
    debug: false,
    clearStrategy: new DefaultClearStrategy(),
    strategy: new DefaultStrategy(),
  };

  public setClient(client: CacheClient): void {
    this.client = client;

    if (this.options && !this.options.ttlSeconds) {
      this.options.ttlSeconds = this.client.getClientTTL();
    }
  }

  public setFallbackClient(client: CacheClient): void {
    this.fallbackClient = client;
  }

  public setOptions(options: CacheManagerOptions): void {
    this.options = options;
  }
}
