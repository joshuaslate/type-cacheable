import * as Redis from 'redis';
import { Cacheable } from '@type-cacheable/core';
import { RedisAdapter } from '../lib';

let client: Redis.RedisClient;
let redisAdapter: RedisAdapter;

const keyName = 'aSimpleKey';
const compoundKey = 'aCompound:key';
const simpleValue = 'aSimpleValue';
const objectValue = { myKeyOne: 'myValOne' };
const arrayValue = ['element1', 2, { complex: 'element' }];

describe('RedisAdapter Tests', () => {
  beforeAll(async () => {
    client = Redis.createClient();

    // Wait until the connection is ready before passing the client to the adapter.
    await new Promise((resolve) => {
      client.on('ready', () => {
        resolve();
      });
    });

    redisAdapter = new RedisAdapter(client);
  });

  describe('Setter tests', () => {
    it('should set a string value on a standard key', async (done) => {
      await redisAdapter.set(keyName, simpleValue);

      client.get(keyName, (err, result) => {
        expect(result).toBe(simpleValue);
        done();
      });
    });

    it('should set an object value on a standard key', async (done) => {
      const keyName = 'aSimpleKey';

      await redisAdapter.set(keyName, objectValue);

      client.get(keyName, (err, result) => {
        expect(result).toBe(JSON.stringify(objectValue));
        done();
      });
    });

    it('should set an array value on a standard key', async (done) => {
      await redisAdapter.set(keyName, arrayValue);

      client.get(keyName, (err, result) => {
        expect(result).toBe(JSON.stringify(arrayValue));
        done();
      });
    });

    it('should set an object value on a compound (x:y) key', async (done) => {
      await redisAdapter.set(compoundKey, objectValue);

      client.hgetall(compoundKey, (err, result) => {
        expect(result).toEqual(objectValue);
        done();
      });
    });

    it('should set an array value on a compound (x:y) key', async (done) => {
      await redisAdapter.set(compoundKey, arrayValue);

      client.hgetall(compoundKey, (err, result) => {
        expect(result).toEqual({ ...result });
        done();
      });
    });

    it('should set an expiresAt value on a compound (x:y) key when TTL is passed in', async () => {
      jest.spyOn(client, 'expire');
      await redisAdapter.set(compoundKey, objectValue, 50000);
      expect(client.expire).toHaveBeenCalled();
    });
  });

  describe('Getter tests', () => {
    it('should get a string set on a simple key', (done) => {
      client.set(keyName, simpleValue, async (err, setResult) => {
        const result = await redisAdapter.get(keyName);
        expect(result).toBe(simpleValue);
        done();
      });
    });

    it('should get an object set on a simple key', (done) => {
      client.set(keyName, JSON.stringify(objectValue), async (err, setResult) => {
        const result = await redisAdapter.get(keyName);
        expect(result).toEqual(objectValue);
        done();
      });
    });

    it('should get an array set on a simple key', (done) => {
      client.set(keyName, JSON.stringify(arrayValue), async (err, setResult) => {
        const result = await redisAdapter.get(keyName);
        expect(result).toEqual(arrayValue);
        done();
      });
    });

    it('should get an object set on a compound (x:y) key', (done) => {
      const args = RedisAdapter.buildSetArgumentsFromObject(objectValue);
      client.hmset(compoundKey, args, async (err, setResult) => {
        const result = await redisAdapter.get(compoundKey);
        expect(result).toEqual(objectValue);
        done();
      });
    });

    it('should get an array set on a compound (x:y) key', (done) => {
      const args = RedisAdapter.buildSetArgumentsFromObject({ ...arrayValue });
      client.hmset(compoundKey, args, async () => {
        const result = await redisAdapter.get(compoundKey);
        expect(result).toEqual(arrayValue);
        done();
      });
    });
  });

  describe('integration', () => {
    it('should properly set, and get cached, values with the @Cacheable decorator', async () => {
      const mockGetIdImplementation = jest.fn();

      class TestClass {
        @Cacheable({ client: redisAdapter, hashKey: 'user' })
        async getId(id: string): Promise<string> {
          mockGetIdImplementation();

          return id;
        }
      }

      const testClass = new TestClass();
      const result1 = await testClass.getId('1');
      expect(result1).toBe('1');
      expect(mockGetIdImplementation).toHaveBeenCalled();
      mockGetIdImplementation.mockClear();

      const result2 = await testClass.getId('1');
      expect(result2).toBe('1');
      expect(mockGetIdImplementation).not.toHaveBeenCalled();
    });
  });

  afterEach((done) => {
    client.flushall(done);
  });

  afterAll(() => {
    client.end(true);
  });
});
