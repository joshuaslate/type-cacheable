export interface CacheClient {
  get(cacheKey: string): Promise<any>;
  set(cacheKey: string, value: any, ttl?: number): Promise<any>;
  del(cacheKey: string): Promise<any>;
  getClientTTL(): number;
}
