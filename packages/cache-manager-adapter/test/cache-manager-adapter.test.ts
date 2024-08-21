import * as cacheManager from 'cache-manager';
import { Cacheable, CacheClear } from '@type-cacheable/core';
import { CacheManagerAdapter, useAdapter } from '../lib';

const keyName = 'aSimpleCacheManagerKey';
const keyName_2 = 'aSimpleCacheManagerKey2';
const compoundKey = 'aCompoundCacheManager:key';
const simpleValue = 'aSimpleCacheManagerValue';
const objectValue = { myKeyOneCacheManager: 'myValOneCacheManager' };
const arrayValue = ['element1CacheManager', 2, { complex: 'elementCacheManager' }];

describe('CacheManagerAdapter Tests', () => {
  let client: cacheManager.Cache;
  let cacheManagerAdapter: CacheManagerAdapter;

  beforeAll(async () => {
    client = await cacheManager.caching('memory');
    cacheManagerAdapter = useAdapter(client);
  });

  describe('Setter tests', () => {
    it('should set a string value on a standard key', async () => {
      await cacheManagerAdapter.set(keyName, simpleValue);
      const result = await client.get(keyName);

      expect(result).toBe(simpleValue);
    });

    it('should set an object value on a standard key', async () => {
      await cacheManagerAdapter.set(keyName, objectValue);
      const result = await client.get(keyName);

      expect(result).toEqual(objectValue);
    });

    it('should set an array value on a standard key', async () => {
      await cacheManagerAdapter.set(keyName, arrayValue);
      const result = await client.get(keyName);

      expect(result).toEqual(arrayValue);
    });

    it('should set an object value on a compound (x:y) key', async () => {
      await cacheManagerAdapter.set(compoundKey, objectValue);
      const result = await client.get(compoundKey);

      expect(result).toEqual(objectValue);
    });

    it('should set an array value on a compound (x:y) key', async () => {
      await cacheManagerAdapter.set(compoundKey, arrayValue);
      const result = await client.get(compoundKey);

      expect(result).toEqual(arrayValue);
    });

    it('should set an expiresAt value on a compound (x:y) key when TTL is passed in', async () => {
      jest.spyOn(client, 'set');
      const ttl = 50000;
      await cacheManagerAdapter.set(compoundKey, objectValue, ttl);

      expect(client.set).toHaveBeenCalledWith(compoundKey, objectValue, ttl);
    });
  });

  describe('Getter tests', () => {
    it('should get a string set on a simple key', async () => {
      await client.set(keyName, simpleValue);
      const result = await cacheManagerAdapter.get(keyName);

      expect(result).toBe(simpleValue);
    });

    it('should get an object set on a simple key', async () => {
      await client.set(keyName, objectValue);
      const result = await cacheManagerAdapter.get(keyName);

      expect(result).toEqual(objectValue);
    });

    it('should get an array set on a simple key', async () => {
      await client.set(keyName, arrayValue);
      const result = await cacheManagerAdapter.get(keyName);

      expect(result).toEqual(arrayValue);
    });

    it('should get an object set on a compound (x:y) key', async () => {
      await client.set(compoundKey, objectValue);
      const result = await cacheManagerAdapter.get(compoundKey);

      expect(result).toEqual(objectValue);
    });

    it('should get an array set on a compound (x:y) key', async () => {
      await client.set(compoundKey, arrayValue);
      const result = await cacheManagerAdapter.get(compoundKey);

      expect(result).toEqual(arrayValue);
    });
  });

  describe('Keys tests', () => {
    it('should get keys by pattern on a compound (x:y) key', async () => {
      await client.set(compoundKey, simpleValue);
      const result = await cacheManagerAdapter.keys(compoundKey);

      expect(result).toHaveLength(1);
      expect(result).toContain(compoundKey);
    });

    it('should not find keys for a non-existent simple key', async () => {
      await client.set(compoundKey, simpleValue);
      const result = await cacheManagerAdapter.keys(simpleValue);

      expect(result).toHaveLength(0);
      expect(result).toBeInstanceOf(Array);
    });
  });

  describe('Delete tests', () => {
    it('should delete one key', async () => {
      await client.set(keyName, simpleValue);
      await cacheManagerAdapter.del(keyName);
      const result = await client.get(keyName);

      expect(result).toBeUndefined();
    });

    it('should not throw error on an empty array of keys', async () => {
      let foundErr;

      try {
        await cacheManagerAdapter.del([])
      } catch (err) {
        foundErr = err;
      }

      expect(foundErr).toBeFalsy();
    });

    it('should delete an array of keys', async () => {
      await Promise.all([
        client.set(keyName, simpleValue),
        client.set(keyName_2, simpleValue),
        client.set(compoundKey, simpleValue),
      ]);

      await cacheManagerAdapter.del([keyName, keyName_2]);
      const result_1 = await client.get(keyName);
      const result_2 = await client.get(keyName_2);
      const result_3 = await client.get(compoundKey);

      expect(result_1).toBeUndefined();
      expect(result_2).toBeUndefined();
      expect(result_3).not.toBeUndefined();
    });
  });

  describe('Delete full hash', () => {
    it('should delete a full hash', async () => {
      const hashKey = compoundKey.split(':')[0];

      await client.set(compoundKey, objectValue);

      const keys = await cacheManagerAdapter.keys(hashKey);
      expect(keys).toHaveLength(1);

      await cacheManagerAdapter.delHash(hashKey);

      const keysPostDelete = await cacheManagerAdapter.keys(hashKey);
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
            client: cacheManagerAdapter,
            hashKey: 'user',
            cacheKey: (x: any) => x[0],
          })
          async getId(id: string): Promise<string> {
            mockGetIdImplementation();

            return id;
          }

          @Cacheable({
            client: cacheManagerAdapter,
            hashKey: 'userInt',
            cacheKey: (x: any) => x[0],
          })
          async getIntId(id: number): Promise<number> {
            mockGetIntIdImplementation();

            return id;
          }

          @Cacheable({
            client: cacheManagerAdapter,
            hashKey: 'boolVal',
            cacheKey: (x: any) => x[0],
          })
          async getBoolValue(value: boolean): Promise<boolean> {
            mockGetBooleanValueImplementation();

            return value;
          }

          @Cacheable({
            client: cacheManagerAdapter,
            hashKey: 'arrVal',
            cacheKey: (x: any) => x[0],
          })
          async getArrayValue(value: string): Promise<any[]> {
            mockGetArrayValueImplementation();

            return ['true', true, 'false', false, 1, '1'];
          }

          @Cacheable({
            client: cacheManagerAdapter,
            hashKey: 'objVal',
            cacheKey: (x: any) => x[0],
          })
          async getObjectValue(value: string): Promise<any> {
            mockGetObjectValueImplementation();

            return { hello: 'world', 1: 2, '2': 1, true: false, false: 'true', date: new Date('2024-01-02') };
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
          date: new Date('2024-01-02'),
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
            client: cacheManagerAdapter,
            cacheKey: 'users',
          })
          async getUsers(): Promise<{ id: string; name: string }[]> {
            return [{ id: '123', name: 'Kodiak' }];
          }

          @Cacheable({
            client: cacheManagerAdapter,
            cacheKey: 'todos',
          })
          async getTodos(): Promise<{ id: string; done: boolean }[]> {
            return [{ id: '456', done: false }];
          }

          @CacheClear({
            client: cacheManagerAdapter,
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

        const userCacheResult = await cacheManagerAdapter.get('users');
        expect(userCacheResult).toEqual([{ id: '123', name: 'Kodiak' }]);

        const todoCacheResult = await cacheManagerAdapter.get('todos');
        expect(todoCacheResult).toEqual([{ id: '456', done: false }]);

        await testInstance.clearAll();

        const userCacheResultPostClear = await cacheManagerAdapter.get('users');
        expect(userCacheResultPostClear).toEqual(undefined);

        const todoCacheResultPostClear = await cacheManagerAdapter.get('todos');
        expect(todoCacheResultPostClear).toEqual(undefined);
      });
    });
  });

  afterEach(async () => {
    await client.reset();
  });
});
