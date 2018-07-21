import * as Redis from 'redis';
import { Cacheable } from '../../lib/decorators';
import { MissingClientError } from '../../lib/errors';
import cacheManager from '../../lib';
import { useRedisAdapter } from '../../lib/util/useAdapter';

const client = Redis.createClient();

describe('Cacheable Decorator Tests', () => {
  beforeEach(() => {
    useRedisAdapter(client);
  });

  it('should throw a MissingClientError if no cache manager was set up', () => {
    cacheManager.client = null;

    try {
      class FailClass {
        @Cacheable()
        public async hello(): Promise<any> {
          return 'world';
        };
      }
    } catch (err) {
      expect(err).toBeInstanceOf(MissingClientError);
    }
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
});
