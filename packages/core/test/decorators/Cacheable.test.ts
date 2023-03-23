import { Cacheable } from '../../lib/decorators';
import { CacheStrategy, CacheStrategyContext, CacheClient } from '../../lib';
import { MockAdapter } from '../test-utils';

describe('Cacheable Decorator Tests', () => {
  it('should not throw an error if the client fails', async () => {
    const client = new MockAdapter();

    class TestClass {
      public aProp: string = 'aVal!';

      @Cacheable({ client })
      public async hello(): Promise<any> {
        return 'world';
      }
    }

    client.get = async (_cacheKey: string) => {
      throw new Error('client failure');
    };

    client.set = async (_cacheKey: string, _value: any) => {
      throw new Error('client failure');
    };

    const testInstance = new TestClass();
    let result;
    let err;
    try {
      result = await testInstance.hello();
    } catch (error) {
      err = error;
    }

    expect(result).toBe('world');
    expect(err).toBeFalsy();
  });

  it('should attempt to get and set the cache on an initial call to a decorated method, only get on subsequent calls', async () => {
    const client = new MockAdapter();

    class TestClass {
      public aProp: string = 'aVal!';

      @Cacheable({ client })
      public async hello(): Promise<any> {
        return 'world';
      }
    }

    const getSpy = jest.spyOn(client, 'get');
    const setSpy = jest.spyOn(client, 'set');

    const testInstance = new TestClass();

    await testInstance.hello();

    // Because the cache hasn't been filled yet, a get and set should be called once each
    expect(getSpy).toHaveBeenCalledTimes(1);
    expect(setSpy).toHaveBeenCalledTimes(1);

    // With the same arguments, the setSpy should not be called again, but the getSpy should
    await testInstance.hello();

    expect(getSpy).toHaveBeenCalledTimes(2);
    expect(setSpy).toHaveBeenCalledTimes(1);
  });

  it('should use the provided strategy', async () => {
    const client = new MockAdapter();

    class CustomStrategy implements CacheStrategy {
      async handle(context: CacheStrategyContext): Promise<any> {
        const result = await context.originalMethod.apply(
          context.originalMethodScope,
          context.originalMethodArgs,
        );
        return `hello ${result}`;
      }
    }

    class TestClass {
      public aProp: string = 'aVal!';

      @Cacheable({ client, strategy: new CustomStrategy() })
      public async hello(): Promise<any> {
        return 'world';
      }
    }

    const testInstance = new TestClass();
    const result = await testInstance.hello();

    expect(result).toEqual('hello world');
  });

  it('should use the provided isCacheable function', async () => {
    const client = new MockAdapter();
    const isCacheable = jest.fn().mockImplementation((value) => value.status === 200);
    jest.spyOn(client, 'set');

    class TestClass {
      @Cacheable({ client, isCacheable })
      public async hello(): Promise<any> {
        return { status: 400, message: 'bad request' };
      }
    }

    const testInstance = new TestClass();
    const result = await testInstance.hello();

    expect(result).toEqual({ status: 400, message: 'bad request' });
    expect(isCacheable).toHaveBeenCalledWith({ status: 400, message: 'bad request' }, [], undefined);
    expect(client.set).not.toHaveBeenCalled();
  });

  it('should use the fallback cache if provided', async () => {
    const inMemMockSet = jest.fn();
    const inMemMockGet = jest.fn();

    class FailingPrimaryClient implements CacheClient {
      delHash(hashKeyOrKeys: string | string[]): Promise<any> {
        throw new Error('Method not implemented.');
      }
      get(cacheKey: string): Promise<any> {
        throw new Error('Method not implemented.');
      }
      set(cacheKey: string, value: any, ttl?: number): Promise<any> {
        throw new Error('Method not implemented.');
      }
      del(cacheKey: string | string[]): Promise<any> {
        throw new Error('Method not implemented.');
      }
      keys(pattern: string): Promise<string[]> {
        throw new Error('Method not implemented.');
      }
      getClientTTL(): number {
        throw new Error('Method not implemented.');
      }
    }

    class InMemClient implements CacheClient {
      private cache = new Map<string, any>();

      get(cacheKey: string): Promise<any> {
        inMemMockGet();
        return this.cache.get(cacheKey);
      }
      set(cacheKey: string, value: any, ttl?: number): Promise<any> {
        inMemMockSet();
        this.cache.set(cacheKey, value);
        return Promise.resolve();
      }
      del(cacheKey: string | string[]): Promise<any> {
        if (typeof cacheKey === 'string') {
          this.cache.delete(cacheKey);
        } else {
          for (const key of cacheKey) {
            this.cache.delete(key);
          }
        }

        return Promise.resolve();
      }
      keys(pattern: string): Promise<string[]> {
        throw new Error('Method not implemented.');
      }
      getClientTTL(): number {
        return 0;
      }
      delHash(hashKeyOrKeys: string | string[]): Promise<any> {
        throw new Error('Method not implemented.');
      }
    }

    const failingPrimaryClient = new FailingPrimaryClient();
    const inMemClient = new InMemClient();

    class TestClass {
      public aProp: string = 'aVal!';

      @Cacheable({ client: failingPrimaryClient, fallbackClient: inMemClient })
      public async hello(): Promise<any> {
        return 'world';
      }
    }

    const testInstance = new TestClass();
    const result = await testInstance.hello();
    expect(inMemMockSet).toHaveBeenCalled();

    expect(result).toEqual('world');

    const result2 = await testInstance.hello();
    expect(inMemMockGet).toHaveBeenCalled();
    expect(result2).toEqual('world');
  });
});
