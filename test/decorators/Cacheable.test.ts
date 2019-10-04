import * as Redis from 'redis';
import { Cacheable } from '../../lib/decorators';
import cacheManager from '../../lib';
import { useRedisAdapter } from '../../lib/util/useAdapter';

let client: Redis.RedisClient;

describe('Cacheable Decorator Tests', () => {
  beforeAll(() => {
    client = Redis.createClient();
  });

  beforeEach(() => {
    useRedisAdapter(client);
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

  afterEach((done) => {
    client.flushall(done);
  });

  afterAll(() => {
    client.end(true);
  });
});
