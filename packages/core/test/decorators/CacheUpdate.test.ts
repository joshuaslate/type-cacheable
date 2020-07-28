import { CacheUpdate, Cacheable } from '../../lib/decorators';
import cacheManager, { CacheStrategy, CacheStrategyContext, CacheClient } from '../../lib';
import { useMockAdapter } from '../test-utils';

describe('CacheUpdate Decorator Tests', () => {
  beforeEach(() => {
    useMockAdapter();
  });

  it('should not throw an error if the client fails', async () => {
    class TestClass {
      @CacheUpdate()
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
      private values = [1, 2, 3, 4, 5];

      @Cacheable({ cacheKey: 'values' })
      public getValues(): Promise<number[]> {
        return Promise.resolve(this.values);
      }

      @Cacheable({ cacheKey: (args) => args[0] })
      public getValue(id: number): Promise<number | undefined> {
        return Promise.resolve(this.values.find((num) => num === id));
      }

      @CacheUpdate({ cacheKey: (args) => args[0], cacheKeysToClear: (args) => ['values', args[0]] })
      public async incrementValue(id: number): Promise<number> {
        let newValue = 0;

        this.values = this.values.map((value) => {
          if (value === id) {
            newValue = value + 1;
            return newValue;
          }

          return value;
        });

        return newValue;
      }
    }

    const getSpy = jest.spyOn(cacheManager.client!, 'get');
    const setSpy = jest.spyOn(cacheManager.client!, 'set');
    const testInstance = new TestClass();
    const freshArrayResult = await testInstance.getValues();
    expect(freshArrayResult).toEqual([1, 2, 3, 4, 5]);
    const freshResult = await testInstance.getValue(2);
    expect(freshResult).toBe(2);

    // Because the cache hasn't been filled yet, a get and set should be called twice each (once per cached decorator call)
    expect(getSpy).toHaveBeenCalledTimes(2);
    expect(setSpy).toHaveBeenCalledTimes(2);

    // With the same arguments, the setSpy should not be called again, but the getSpy should
    const cachedResult = await testInstance.getValue(2);
    expect(cachedResult).toBe(2);

    expect(getSpy).toHaveBeenCalledTimes(3);
    expect(setSpy).toHaveBeenCalledTimes(2);

    const incrementedResult = await testInstance.incrementValue(2);
    const incrementedArrayResult = await testInstance.getValues();
    expect(incrementedResult).toBe(3);
    expect(incrementedArrayResult).toEqual([1, 3, 3, 4, 5]);

    expect(getSpy).toHaveBeenCalledTimes(4);
    expect(setSpy).toHaveBeenCalledTimes(4);
  });

  it('should use the provided strategy', async () => {
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
      @CacheUpdate({ strategy: new CustomStrategy() })
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
      @CacheUpdate({ client: new FailingPrimaryClient(), fallbackClient: new InMemClient() })
      public async hello(): Promise<any> {
        return 'world';
      }
    }

    const testInstance = new TestClass();
    const result = await testInstance.hello();
    expect(inMemMockSet).toHaveBeenCalled();

    expect(result).toEqual('world');

    const result2 = await testInstance.hello();
    expect(result2).toEqual('world');
  });
});
