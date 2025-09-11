import { MockAdapter } from '@type-cacheable/core/test/test-utils';
import type {
  CacheClient,
  CacheUpdateStrategy,
  CacheUpdateStrategyContext,
} from '../../lib';
import { Cacheable, CacheUpdate } from '../../lib/decorators';

describe('CacheUpdate Decorator Tests', () => {
  it('should not throw an error if the client fails', async () => {
    const client = new MockAdapter();

    class TestClass {
      @CacheUpdate({ client })
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
    let err: any;
    try {
      await testInstance.hello();
    } catch (error) {
      err = error;
    }

    expect(err).toBeFalsy();
  });

  it('should attempt to get and set the cache on an initial call to a decorated method, only get on subsequent calls', async () => {
    const client = new MockAdapter();

    class TestClass {
      private values = [1, 2, 3, 4, 5];

      @Cacheable({ client, cacheKey: 'values' })
      public getValues(): Promise<number[]> {
        return Promise.resolve(this.values);
      }

      @Cacheable({ client, cacheKey: (args) => args[0] })
      public getValue(id: number): Promise<number | undefined> {
        return Promise.resolve(this.values.find((num) => num === id));
      }

      @CacheUpdate({
        client,
        cacheKey: (args: any[]) => args[0],
        cacheKeysToClear: (args) => ['values', args[0]],
      })
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

    const getSpy = jest.spyOn(client, 'get');
    const setSpy = jest.spyOn(client, 'set');
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

  it('should use the result to set the final cacheKey', async () => {
    const client = new MockAdapter();
    const mockGetUser = jest.fn();

    class TestClass {
      private lastCreatedId = 0;
      private users = [];

      @Cacheable({ client, cacheKey: 'users' })
      public getUsers(): Promise<any[]> {
        return Promise.resolve(this.users);
      }

      @Cacheable({ client, cacheKey: (args) => args[0] })
      public getUser(id: number): Promise<any> {
        mockGetUser();
        return Promise.resolve(this.users.find((user: any) => user.id === id));
      }

      @CacheUpdate({
        client,
        cacheKey: (_, __, result) => result.id,
        cacheKeysToClear: (args) => ['users', args[0]],
      })
      public async createUser(user: any): Promise<any> {
        const newUser = { id: Math.random() * 100, ...user };
        this.lastCreatedId = newUser.id;

        return newUser;
      }
    }

    const testInstance = new TestClass();
    const createdUser = await testInstance.createUser({
      name: 'Joe',
      email: 'fake@fakeemail.com',
    });
    const fetchedUser = await testInstance.getUser(createdUser.id);

    expect(fetchedUser).toEqual(createdUser);
    expect(mockGetUser).not.toHaveBeenCalled();
  });

  it('should use the provided strategy', async () => {
    const client = new MockAdapter();

    class CustomStrategy implements CacheUpdateStrategy {
      async handle(context: CacheUpdateStrategyContext): Promise<any> {
        return `hello ${context.result}`;
      }
    }

    class TestClass {
      @CacheUpdate({ client, strategy: new CustomStrategy() })
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
      delHash(hashKeyOrKeys: string | string[]): Promise<any> {
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
      delHash(hashKeyOrKeys: string | string[]): Promise<any> {
        throw new Error('Method not implemented.');
      }
      getClientTTL(): number {
        return 0;
      }
    }

    class TestClass {
      @CacheUpdate({
        client: new FailingPrimaryClient(),
        fallbackClient: new InMemClient(),
      })
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
