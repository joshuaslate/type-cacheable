import cacheManager, { CacheClient } from '../lib';

export class MockAdapter implements CacheClient {
  private cache: { [key: string]: any } = {};

  get(cacheKey: string): Promise<any> {
    return this.cache[cacheKey];
  }

  set(cacheKey: string, value: any, ttl?: number): Promise<any> {
    this.cache[cacheKey] = value;

    return Promise.resolve(value);
  }

  del(cacheKey: string | string[]): Promise<any> {
    if (typeof cacheKey === 'string') {
      delete this.cache[cacheKey];
    } else {
      cacheKey.forEach((key) => {
        delete this.cache[key];
      });
    }

    return Promise.resolve(undefined);
  }

  keys(pattern: string): Promise<string[]> {
    return Promise.resolve(Object.keys(this.cache));
  }

  getClientTTL(): number {
    return 84600;
  }
}

export const useMockAdapter = () => {
  cacheManager.setClient(new MockAdapter());
};
