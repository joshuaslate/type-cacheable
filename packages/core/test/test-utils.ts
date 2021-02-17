import cacheManager, { CacheClient } from '../lib';

export class MockAdapter implements CacheClient {
  constructor() {
    this.get = this.get.bind(this);
    this.del = this.del.bind(this);
    this.delHash = this.delHash.bind(this);
    this.getClientTTL = this.getClientTTL.bind(this);
    this.keys = this.keys.bind(this);
    this.set = this.set.bind(this);
  }

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
    return Promise.resolve(Object.keys(this.cache).filter((key) => key.includes(pattern)));
  }

  getClientTTL(): number {
    return 84600;
  }

  async delHash(hashKeyOrKeys: string | string[]): Promise<any> {
    const finalDeleteKeys = Array.isArray(hashKeyOrKeys) ? hashKeyOrKeys : [hashKeyOrKeys];
    const deletePromises = finalDeleteKeys.map((key) => this.keys(key).then(this.del));
    await Promise.all(deletePromises);
    return;
  }
}

export const useMockAdapter = () => {
  cacheManager.setClient(new MockAdapter());
};
