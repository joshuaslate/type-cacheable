export interface CacheClient {
  get(cacheKey: string): Promise<any>;
  set(cacheKey: string, value: any, ttl?: number): Promise<any>;
  del(cacheKey: string | string[]): Promise<any>;
  keys(pattern: string): Promise<string[]>;
  delHash(hashKeyOrKeys: string | string[]): Promise<any>;
  getClientTTL(): number;
}
