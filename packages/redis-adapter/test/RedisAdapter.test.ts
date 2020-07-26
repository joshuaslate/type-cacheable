import * as Redis from 'redis';
import { Cacheable } from '@type-cacheable/core';
import { RedisAdapter } from '../lib';

let client: Redis.RedisClient;
let redisAdapter: RedisAdapter;

const keyName = 'aSimpleKey';
const simpleKeyKeys = 'anotherSimpleKey';
const compoundKey = 'aCompound:key';
const compoundKeyKeys = 'aCompound:keys';
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
        expect(result).toBe(JSON.stringify(simpleValue));
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
        expect(result).toEqual(
          Object.keys(objectValue).reduce((accum, curr) => {
            accum[curr] = JSON.stringify((objectValue as any)[curr]);

            return accum;
          }, {} as any),
        );
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

  describe('Keys tests', () => {
    it('should get keys by pattern on a compound (x:y) key', (done) => {
      client.set(compoundKeyKeys, simpleValue, async () => {
        const result = await redisAdapter.keys(`*${compoundKeyKeys}*`);

        expect(result).toHaveLength(1);
        expect(result).toContain(compoundKeyKeys);
        done();
      });
    });

    it('should not found keys on a simple key with non-match', (done) => {
      client.set(simpleKeyKeys, simpleValue, async () => {
        const result = await redisAdapter.keys(`*${simpleValue}*`);

        expect(result).toHaveLength(0);
        expect(result).toBeInstanceOf(Array);
        done();
      });
    });
  });

  describe('integration', () => {
    describe('@Cacheable decorator', () => {
      const getTestInstance = () => {
        const mockGetIdImplementation = jest.fn();
        const mockGetIntIdImplementation = jest.fn();
        const mockGetBooleanValueImplementation = jest.fn();
        const mockGetArrayValueImplementation = jest.fn();
        const mockGetObjectValueImplementation = jest.fn();

        class TestClass {
          @Cacheable({ client: redisAdapter, hashKey: 'user', cacheKey: (x) => x[0] })
          async getId(id: string): Promise<string> {
            mockGetIdImplementation();

            return id;
          }

          @Cacheable({ client: redisAdapter, hashKey: 'userInt', cacheKey: (x) => x[0] })
          async getIntId(id: number): Promise<number> {
            mockGetIntIdImplementation();

            return id;
          }

          @Cacheable({ client: redisAdapter, hashKey: 'boolVal', cacheKey: (x) => x[0] })
          async getBoolValue(value: boolean): Promise<boolean> {
            mockGetBooleanValueImplementation();

            return value;
          }

          @Cacheable({ client: redisAdapter, hashKey: 'arrVal', cacheKey: (x) => x[0] })
          async getArrayValue(value: string): Promise<any[]> {
            mockGetArrayValueImplementation();

            return ['true', true, 'false', false, 1, '1'];
          }

          @Cacheable({ client: redisAdapter, hashKey: 'objVal', cacheKey: (x) => x[0] })
          async getObjectValue(value: string): Promise<any> {
            mockGetObjectValueImplementation();

            return { hello: 'world', 1: 2, '2': 1, true: false, false: 'true' };
          }
        }

        const testClass = new TestClass();

        return {
          testClass,
          mockGetIdImplementation,
          mockGetIntIdImplementation,
          mockGetBooleanValueImplementation,
          mockGetArrayValueImplementation,
          mockGetObjectValueImplementation,
        };
      };

      it('should properly set, and get, cached string values', async () => {
        const { testClass, mockGetIdImplementation } = getTestInstance();
        const getIdResult1 = await testClass.getId('1');
        expect(getIdResult1).toBe('1');
        expect(mockGetIdImplementation).toHaveBeenCalled();
        mockGetIdImplementation.mockClear();

        const getIdResult2 = await testClass.getId('1');
        expect(getIdResult2).toBe('1');
        expect(mockGetIdImplementation).not.toHaveBeenCalled();
      });

      it('should properly set, and get, cached number values', async () => {
        const { testClass, mockGetIntIdImplementation } = getTestInstance();
        const getIntIdResult1 = await testClass.getIntId(1);
        expect(getIntIdResult1).toBe(1);
        expect(mockGetIntIdImplementation).toHaveBeenCalled();
        mockGetIntIdImplementation.mockClear();

        const getIntIdResult2 = await testClass.getIntId(1);
        expect(getIntIdResult2).toBe(1);
        expect(mockGetIntIdImplementation).not.toHaveBeenCalled();
      });

      it('should properly set, and get, cached boolean values', async () => {
        const { testClass, mockGetBooleanValueImplementation } = getTestInstance();
        const getBooleanValueResult1 = await testClass.getBoolValue(true);
        expect(getBooleanValueResult1).toBe(true);
        expect(mockGetBooleanValueImplementation).toHaveBeenCalled();
        mockGetBooleanValueImplementation.mockClear();

        const getBooleanValueResult2 = await testClass.getBoolValue(true);
        expect(getBooleanValueResult2).toBe(true);
        expect(mockGetBooleanValueImplementation).not.toHaveBeenCalled();
      });

      it('should properly set, and get, cached array values', async () => {
        const { testClass, mockGetArrayValueImplementation } = getTestInstance();
        const getArrayValueResult1 = await testClass.getArrayValue('test');
        expect(mockGetArrayValueImplementation).toHaveBeenCalled();
        expect(getArrayValueResult1).toEqual(['true', true, 'false', false, 1, '1']);
        mockGetArrayValueImplementation.mockClear();

        const getArrayValueResult2 = await testClass.getArrayValue('test');
        expect(getArrayValueResult2).toEqual(getArrayValueResult1);
        expect(mockGetArrayValueImplementation).not.toHaveBeenCalled();
      });

      it('should properly set, and get, cached object values', async () => {
        const { testClass, mockGetObjectValueImplementation } = getTestInstance();
        const getObjectValueResult1 = await testClass.getObjectValue('test');
        expect(mockGetObjectValueImplementation).toHaveBeenCalled();
        expect(getObjectValueResult1).toEqual({
          hello: 'world',
          1: 2,
          '2': 1,
          true: false,
          false: 'true',
        });
        mockGetObjectValueImplementation.mockClear();

        const getObjectValueResult2 = await testClass.getObjectValue('test');
        expect(getObjectValueResult2).toEqual(getObjectValueResult1);
        expect(mockGetObjectValueImplementation).not.toHaveBeenCalled();
      });
    });
  });

  afterEach((done) => {
    client.flushall(done);
  });

  afterAll(() => {
    client.end(true);
  });
});
