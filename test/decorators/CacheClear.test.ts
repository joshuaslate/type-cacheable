import * as Redis from 'redis';
import { Cacheable, CacheClear } from '../../lib/decorators';
import { MissingClientError } from '../../lib/errors';
import cacheManager from '../../lib';
import { useRedisAdapter } from '../../lib/util/useAdapter';

let client: Redis.RedisClient;

describe('CacheClear Decorator Tests', () => {
  beforeAll(() => {
    client = Redis.createClient();
  });

  beforeEach(() => {
    useRedisAdapter(client);
  });

  it('should throw a MissingClientError if no cache manager was set up', () => {
    cacheManager.client = null;

    try {
      class FailClass {
        @CacheClear()
        public async hello(): Promise<any> {
          return 'world';
        };
      }
    } catch (err) {
      expect(err).toBeInstanceOf(MissingClientError);
    }
  });

  it('should clear a cached key when a CacheClear-decorated method is called', async () => {
    class TestClass {
      public aProp: string = 'aVal!';

      static setCacheKey = (args: any[]) => args[0];

      @Cacheable({ cacheKey: TestClass.setCacheKey })
      public async getProp(id: string): Promise<any> {
        return this.aProp;
      }

      @CacheClear({ cacheKey: TestClass.setCacheKey })
      public async setProp(id: string, value: string): Promise<void> {
        this.aProp = value;
      }
    }
    
    const getSpy = jest.spyOn(cacheManager.client!, 'get');
    const delSpy = jest.spyOn(cacheManager.client!, 'del');
    const testInstance = new TestClass();

    await testInstance.getProp('1');
    await testInstance.setProp('1', 'anotherValue!');
    await testInstance.getProp('1');

    expect(delSpy).toHaveBeenCalledTimes(1);
    expect(getSpy).toHaveBeenCalledTimes(2);
  });

  afterEach((done) => {
    client.flushall(done);
  });

  afterAll(() => {
    client.end(true);
  });
});
