import { Cacheable } from '../../lib/decorators';
import cacheManager, { CacheStrategy, CacheStrategyContext, CacheClient } from '../../lib';
import { useMockAdapter } from '../test-utils';

describe('Cacheable Decorator Tests', () => {
  beforeEach(() => {
    useMockAdapter();
  });

  it('should not throw an error if the client fails', async () => {
    class TestClass {
      public aProp: string = 'aVal!';

      @Cacheable()
      public async hello(): Promise<any> {
        return 'world';
      }
    }

    cacheManager.client!.get = async (cacheKey: string) => {
      throw new Error('client failure');
    };

    cacheManager.client!.set = async (cacheKey: string, value: any) => {
      throw new Error('client failure');
    };

    const testInstance = new TestClass();
    let err;
    try {
      await testInstance.hello();
    } catch (error) {
      err = error;
    }

    expect(err).toBeFalsy();
  });

  it('should attempt to get and set the cache on an initial call to a decorated method, only get on subsequent calls', async () => {
    class TestClass {
      public aProp: string = 'aVal!';

      @Cacheable()
      public async hello(): Promise<any> {
        return 'world';
      }
    }

    const getSpy = jest.spyOn(cacheManager.client!, 'get');
    const setSpy = jest.spyOn(cacheManager.client!, 'set');
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
    class CustomStrategy implements CacheStrategy {
      async handle(context: CacheStrategyContext): Promise<any> {
        const result = await context.originalFunction.apply(
          context.originalFunctionScope,
          context.originalFunctionArgs,
        );
        return `hello ${result}`;
      }
    }

    class TestClass {
      public aProp: string = 'aVal!';

      @Cacheable({ strategy: new CustomStrategy() })
      public async hello(): Promise<any> {
        return 'world';
      }
    }

    const testInstance = new TestClass();
    const result = await testInstance.hello();

    expect(result).toEqual('hello world');
  });

  it('should use the fallback cache if provided', async () => {
    const inMemMockSet = jest.fn();
    const inMemMockGet = jest.fn();

    class FailingPrimaryClient implements CacheClient {
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
    }

    class TestClass {
      public aProp: string = 'aVal!';

      @Cacheable({ client: new FailingPrimaryClient(), fallbackClient: new InMemClient() })
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
