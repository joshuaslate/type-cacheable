import { createClient, RedisClientType } from 'redis';
import { Cacheable, CacheClear } from '@type-cacheable/core';
import { RedisAdapter, useAdapter } from '../lib';

const keyName = 'aSimpleKeyForRedis';
const simpleKeyKeys = 'anotherSimpleKeyForRedis';
const compoundKey = 'aCompound:keyForRedis';
const compoundKeyKeys = 'aCompound:keysForRedis';
const simpleValue = 'aSimpleValueForRedis';
const objectValue = { myKeyOne: 'myValOneForRedis' };
const arrayValue = ['element1', 2, { complex: 'elementForRedis' }];

describe('RedisAdapter Tests', () => {
  let client: RedisClientType<any>;
  let redisAdapter: RedisAdapter;

  beforeAll(async () => {
    client = createClient(
    process.env.REDIS_HOST && process.env.REDIS_PORT ?
        { url: `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT}` }
        : undefined,
    );
    redisAdapter = useAdapter(client);
  });

  describe('Setter tests', () => {
    it('should set a string value on a standard key', async () => {
      await redisAdapter.set(keyName, simpleValue);
      const result = await client.get(keyName);
      expect(result).toBe(JSON.stringify(simpleValue));
    });

    it('should set an object value on a standard key', async () => {
      const keyName = 'aSimpleKey';
      await redisAdapter.set(keyName, objectValue);
      const result = await client.get(keyName);

      expect(result).toBe(JSON.stringify(objectValue));
    });

    it('should set an array value on a standard key', async () => {
      await redisAdapter.set(keyName, arrayValue);
      const result = await client.get(keyName);

      expect(result).toBe(JSON.stringify(arrayValue));
    });

    it('should set an object value on a compound (x:y) key', async () => {
      await redisAdapter.set(compoundKey, objectValue);
      const result = await client.hGetAll(compoundKey);

      expect(result).toEqual(
          Object.keys(objectValue).reduce((accum, curr) => {
            accum[curr] = JSON.stringify((objectValue as any)[curr]);

            return accum;
          }, {} as any),
      );
    });

    it('should set an array value on a compound (x:y) key', async () => {
      await redisAdapter.set(compoundKey, arrayValue);
      const result = await client.hGetAll(compoundKey);

      expect(result).toEqual({ ...result });
    });

    it('should set an expiresAt value on a compound (x:y) key when TTL is passed in', async () => {
      // @ts-ignore
      jest.spyOn(client, 'expire');
      await redisAdapter.set(compoundKey, objectValue, 50000);

      expect(client.expire).toHaveBeenCalled();
    });
  });

  describe('Getter tests', () => {
    it('should get a string set on a simple key', async () => {
      await client.set(keyName, simpleValue)
      const result = await redisAdapter.get(keyName);

      expect(result).toBe(simpleValue);
    });

    it('should get an object set on a simple key', async () => {
      await client.set(keyName, JSON.stringify(objectValue));
      const result = await redisAdapter.get(keyName);

      expect(result).toEqual(objectValue);
    });

    it('should get an array set on a simple key', async () => {
      await client.set(keyName, JSON.stringify(arrayValue));
      const result = await redisAdapter.get(keyName);

      expect(result).toEqual(arrayValue);
    });

    it('should get an object set on a compound (x:y) key', async () => {
      const args = RedisAdapter.buildSetArgumentsFromObject(objectValue);
      await client.hSet(compoundKey, args);
      const result = await redisAdapter.get(compoundKey);

      expect(result).toEqual(objectValue);
    });

    it('should get an array set on a compound (x:y) key', async () => {
      const args = RedisAdapter.buildSetArgumentsFromObject({ ...arrayValue });
      await client.hSet(compoundKey, args);
      const result = await redisAdapter.get(compoundKey);
      expect(result).toEqual(arrayValue);
    });
  });

  describe('Keys tests', () => {
    it('should get keys by pattern on a compound (x:y) key', async () => {
      await client.set(compoundKeyKeys, simpleValue);
      const result = await redisAdapter.keys(`*${compoundKeyKeys}*`);

      expect(result).toHaveLength(1);
      expect(result).toContain(compoundKeyKeys);
    });

    it('should not find keys for a non-existent simple key', async () => {
      await client.set(simpleKeyKeys, simpleValue);
      const result = await redisAdapter.keys(`*${simpleValue}*`);

      expect(result).toHaveLength(0);
      expect(result).toBeInstanceOf(Array);
    });

    it('should return multiple pages worth of keys when more than the max page size exist', async () => {
      const values = new Array(5000)
          .fill(undefined)
          .reduce((accum, _, i) => ({...accum, [`key-${i}`]: `val-${i}`}), {});

      await client.mSet(values);
      const result = await redisAdapter.keys('*key-*');

      expect(result).toHaveLength(5000);
    });
  });

  describe('Delete tests', () => {
    it('should delete a set value', async () => {
      await client.set(simpleKeyKeys, simpleValue);
      await redisAdapter.del(keyName);

      expect(await redisAdapter.get(keyName)).toBeFalsy();
    });
  });

  describe('Delete full hash', () => {
    it('should delete a full hash', async () => {
      const hashKey = compoundKey.split(':')[0];
      const args = RedisAdapter.buildSetArgumentsFromObject({ ...objectValue });

      await client.hSet(compoundKey, args);

      const keys = await redisAdapter.keys(`*${hashKey}:*`);

      expect(keys).toHaveLength(1);

      await redisAdapter.delHash(hashKey);

      const keysPostDelete = await redisAdapter.keys(`*${hashKey}:*`);

      expect(keysPostDelete).toHaveLength(0);
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
          @Cacheable({
            client: redisAdapter,
            hashKey: 'user',
            cacheKey: (x) => x[0],
          })
          async getId(id: string): Promise<string> {
            mockGetIdImplementation();

            return id;
          }

          @Cacheable({
            client: redisAdapter,
            hashKey: 'userInt',
            cacheKey: (x) => x[0],
          })
          async getIntId(id: number): Promise<number> {
            mockGetIntIdImplementation();

            return id;
          }

          @Cacheable({
            client: redisAdapter,
            hashKey: 'boolVal',
            cacheKey: (x) => x[0],
          })
          async getBoolValue(value: boolean): Promise<boolean> {
            mockGetBooleanValueImplementation();

            return value;
          }

          @Cacheable({
            client: redisAdapter,
            hashKey: 'arrVal',
            cacheKey: (x) => x[0],
          })
          async getArrayValue(value: string): Promise<any[]> {
            mockGetArrayValueImplementation();

            return ['true', true, 'false', false, 1, '1'];
          }

          @Cacheable({
            client: redisAdapter,
            hashKey: 'objVal',
            cacheKey: (x) => x[0],
          })
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

    describe('@CacheClear Decorator', () => {
      const getTestInstance = () => {
        class TestClass {
          @Cacheable({
            client: redisAdapter,
            cacheKey: 'users',
          })
          async getUsers(): Promise<{ id: string; name: string }[]> {
            return [{ id: '123', name: 'Kodiak' }];
          }

          @Cacheable({
            client: redisAdapter,
            cacheKey: 'todos',
          })
          async getTodos(): Promise<{ id: string; done: boolean }[]> {
            return [{ id: '456', done: false }];
          }

          @CacheClear({
            client: redisAdapter,
            cacheKey: ['users', 'todos'],
          })
          async clearAll(): Promise<void> {
            return;
          }
        }

        const testInstance = new TestClass();

        return {
          testInstance,
        };
      };

      it('should clear multiple cacheKeys when an array is passed', async () => {
        const { testInstance } = getTestInstance();

        await testInstance.getUsers();
        await testInstance.getTodos();

        const userCacheResult = await redisAdapter.get('users');
        expect(userCacheResult).toEqual([{ id: '123', name: 'Kodiak' }]);

        const todoCacheResult = await redisAdapter.get('todos');
        expect(todoCacheResult).toEqual([{ id: '456', done: false }]);

        await testInstance.clearAll();

        const userCacheResultPostClear = await redisAdapter.get('users');
        expect(userCacheResultPostClear).toEqual(null);

        const todoCacheResultPostClear = await redisAdapter.get('todos');
        expect(todoCacheResultPostClear).toEqual(null);
      });
    });
  });

  afterEach(async () => {
    await client.flushAll();
  });

  afterAll(async () => {
    await client.disconnect()
  });
});
