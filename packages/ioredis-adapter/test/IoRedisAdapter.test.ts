import * as IoRedis from 'ioredis';
import { Cacheable, CacheClear } from '@type-cacheable/core';
import { IoRedisAdapter, useAdapter } from '../lib';

let client: IoRedis.Redis;
let ioRedisAdapter: IoRedisAdapter;

const keyName = 'aSimpleIoRedisKey';
const keyName_2 = 'aSimpleIoRedisKey2';
const compoundKey = 'aCompoundIoRedis:key';
const simpleValue = 'aSimpleIoRedisValue';
const objectValue = { myKeyOneIoRedis: 'myValOneIoRedis' };
const arrayValue = ['element1IoRedis', 2, { complex: 'elementIoRedis' }];

describe('IoRedisAdapter Tests', () => {
  beforeAll(async () => {
    client = new IoRedis();
    ioRedisAdapter = useAdapter(client);
  });

  describe('Setter tests', () => {
    it('should set a string value on a standard key', async () => {
      await ioRedisAdapter.set(keyName, simpleValue);
      const result = await client.get(keyName);

      expect(result).toBe(JSON.stringify(simpleValue));
    });

    it('should set an object value on a standard key', async () => {
      await ioRedisAdapter.set(keyName, objectValue);
      const result = await client.get(keyName);

      expect(result).toBe(JSON.stringify(objectValue));
    });

    it('should set an array value on a standard key', async () => {
      await ioRedisAdapter.set(keyName, arrayValue);
      const result = await client.get(keyName);

      expect(result).toBe(JSON.stringify(arrayValue));
    });

    it('should set an object value on a compound (x:y) key', async () => {
      await ioRedisAdapter.set(compoundKey, objectValue);
      const result = await client.get(compoundKey);

      expect(result).toEqual(JSON.stringify(objectValue));
    });

    it('should set an array value on a compound (x:y) key', async () => {
      await ioRedisAdapter.set(compoundKey, arrayValue);
      const result = await client.get(compoundKey);

      expect(result).toEqual(JSON.stringify(arrayValue));
    });

    it('should set an expiresAt value on a compound (x:y) key when TTL is passed in', async () => {
      jest.spyOn(client, 'set');
      const ttl = 50000;
      await ioRedisAdapter.set(compoundKey, objectValue, ttl);

      expect(client.set).toHaveBeenCalledWith(compoundKey, JSON.stringify(objectValue), [
        'EX',
        ttl,
      ]);
    });
  });

  describe('Getter tests', () => {
    it('should get a string set on a simple key', async () => {
      await client.set(keyName, simpleValue);
      const result = await ioRedisAdapter.get(keyName);

      expect(result).toBe(simpleValue);
    });

    it('should get an object set on a simple key', async () => {
      await client.set(keyName, JSON.stringify(objectValue));
      const result = await ioRedisAdapter.get(keyName);

      expect(result).toEqual(objectValue);
    });

    it('should get an array set on a simple key', async () => {
      await client.set(keyName, JSON.stringify(arrayValue));
      const result = await ioRedisAdapter.get(keyName);

      expect(result).toEqual(arrayValue);
    });

    it('should get an object set on a compound (x:y) key', async () => {
      const args = JSON.stringify(objectValue);
      await client.set(compoundKey, args);
      const result = await ioRedisAdapter.get(compoundKey);

      expect(result).toEqual(objectValue);
    });

    it('should get an array set on a compound (x:y) key', async () => {
      const args = JSON.stringify(arrayValue);
      await client.set(compoundKey, args);
      const result = await ioRedisAdapter.get(compoundKey);

      expect(result).toEqual(arrayValue);
    });
  });

  describe('Keys tests', () => {
    it('should get keys by pattern on a compound (x:y) key', async () => {
      await client.set(compoundKey, simpleValue);
      const result = await ioRedisAdapter.keys(`*${compoundKey}*`);

      expect(result).toHaveLength(1);
      expect(result).toContain(compoundKey);
    });

    it('should not find keys for a non-existent simple key', async () => {
      await client.set(compoundKey, simpleValue);
      const result = await ioRedisAdapter.keys(`*${simpleValue}*`);

      expect(result).toHaveLength(0);
      expect(result).toBeInstanceOf(Array);
    });

    it('should return multiple pages worth of keys when more than the max page size exist', async () => {
      const vals = new Array(5000)
        .fill(undefined)
        .reduce((accum, _, i) => [...accum, `key-${i}`, `val-${i}`], []);
      await client.mset(...vals);

      const result = await ioRedisAdapter.keys('*key-*');
      expect(result).toHaveLength(5000);
    });
  });

  describe('Delete tests', () => {
    it('should delete one key', async () => {
      await client.set(keyName, simpleValue);
      await ioRedisAdapter.del(keyName);
      const result = await client.get(keyName);

      expect(result).toBeNull();
    });

    it('should not throw error on an empty array of keys', async (done) => {
      await ioRedisAdapter.del([]);
      done();
    });

    it('should delete an array of keys', async () => {
      await Promise.all([
        client.set(keyName, simpleValue),
        client.set(keyName_2, simpleValue),
        client.set(compoundKey, simpleValue),
      ]);

      await ioRedisAdapter.del([keyName, keyName_2]);
      const result_1 = await client.get(keyName);
      const result_2 = await client.get(keyName_2);
      const result_3 = await client.get(compoundKey);

      expect(result_1).toBeNull();
      expect(result_2).toBeNull();
      expect(result_3).not.toBeNull();
    });
  });

  describe('Delete full hash', () => {
    it('should delete a full hash', async (done) => {
      const hashKey = compoundKey.split(':')[0];

      client.hmset(compoundKey, objectValue, async () => {
        const keys = await ioRedisAdapter.keys(`*${hashKey}:*`);
        expect(keys).toHaveLength(1);

        await ioRedisAdapter.delHash(hashKey);

        const keysPostDelete = await ioRedisAdapter.keys(`*${hashKey}:*`);
        expect(keysPostDelete).toHaveLength(0);
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
          @Cacheable({
            client: ioRedisAdapter,
            hashKey: 'user',
            cacheKey: (x: any) => x[0],
          })
          async getId(id: string): Promise<string> {
            mockGetIdImplementation();

            return id;
          }

          @Cacheable({
            client: ioRedisAdapter,
            hashKey: 'userInt',
            cacheKey: (x: any) => x[0],
          })
          async getIntId(id: number): Promise<number> {
            mockGetIntIdImplementation();

            return id;
          }

          @Cacheable({
            client: ioRedisAdapter,
            hashKey: 'boolVal',
            cacheKey: (x: any) => x[0],
          })
          async getBoolValue(value: boolean): Promise<boolean> {
            mockGetBooleanValueImplementation();

            return value;
          }

          @Cacheable({
            client: ioRedisAdapter,
            hashKey: 'arrVal',
            cacheKey: (x: any) => x[0],
          })
          async getArrayValue(value: string): Promise<any[]> {
            mockGetArrayValueImplementation();

            return ['true', true, 'false', false, 1, '1'];
          }

          @Cacheable({
            client: ioRedisAdapter,
            hashKey: 'objVal',
            cacheKey: (x: any) => x[0],
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
            client: ioRedisAdapter,
            cacheKey: 'users',
          })
          async getUsers(): Promise<{ id: string; name: string }[]> {
            return [{ id: '123', name: 'Kodiak' }];
          }

          @Cacheable({
            client: ioRedisAdapter,
            cacheKey: 'todos',
          })
          async getTodos(): Promise<{ id: string; done: boolean }[]> {
            return [{ id: '456', done: false }];
          }

          @CacheClear({
            client: ioRedisAdapter,
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

        const userCacheResult = await ioRedisAdapter.get('users');
        expect(userCacheResult).toEqual([{ id: '123', name: 'Kodiak' }]);

        const todoCacheResult = await ioRedisAdapter.get('todos');
        expect(todoCacheResult).toEqual([{ id: '456', done: false }]);

        await testInstance.clearAll();

        const userCacheResultPostClear = await ioRedisAdapter.get('users');
        expect(userCacheResultPostClear).toEqual(null);

        const todoCacheResultPostClear = await ioRedisAdapter.get('todos');
        expect(todoCacheResultPostClear).toEqual(null);
      });
    });
  });

  afterEach(async () => {
    await client.flushall();
  });

  afterAll(async () => {
    await client.quit();
  });
});
