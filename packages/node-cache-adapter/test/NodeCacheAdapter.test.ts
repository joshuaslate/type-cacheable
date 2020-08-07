import * as NodeCache from 'node-cache';
import { Cacheable } from '@type-cacheable/core';
import { NodeCacheAdapter } from '../lib';

let client: NodeCache;
let nodeCacheAdapter: NodeCacheAdapter;

const keyName = 'aSimpleKey';
const compoundKey1 = 'aCompound';
const compoundKey2 = 'key';
const compoundCombined = `${compoundKey1}:${compoundKey2}`;
const simpleValue = 'aSimpleValue';
const objectValue = { myKeyOne: 'myValOne' };
const arrayValue = ['element1', 2, { complex: 'element' }];

describe('NodeCacheAdapter Tests', () => {
  beforeAll(() => {
    client = new NodeCache();
    nodeCacheAdapter = new NodeCacheAdapter(client);
  });

  describe('Setter tests', () => {
    it('should set a string value on a standard key', async () => {
      await nodeCacheAdapter.set(keyName, simpleValue);

      expect(client.get<string>(keyName)).toBe(simpleValue);
    });

    it('should set an object value on a standard key', async () => {
      const keyName = 'aSimpleKey';

      await nodeCacheAdapter.set(keyName, objectValue);
      expect(client.get<Object>(keyName)).toEqual(objectValue);
    });

    it('should set an array value on a standard key', async () => {
      await nodeCacheAdapter.set(keyName, arrayValue);
      expect(client.get<any[]>(keyName)).toEqual(arrayValue);
    });

    it('should set a string value on a compound (x:y) key', async () => {
      await nodeCacheAdapter.set(compoundCombined, simpleValue);
      expect(client.get<string>(compoundCombined)).toBe(simpleValue);
    });

    it('should set an object value on a compound (x:y) key', async () => {
      await nodeCacheAdapter.set(compoundCombined, objectValue);
      expect(client.get<Object>(compoundCombined)).toEqual(objectValue);
    });

    it('should set an array value on a compound (x:y) key', async () => {
      await nodeCacheAdapter.set(compoundCombined, arrayValue);
      expect(client.get<any[]>(compoundCombined)).toEqual(arrayValue);
    });
  });

  describe('Getter tests', () => {
    it('should get a string set on a simple key', async () => {
      client.set<string>(keyName, simpleValue);
      const result = await nodeCacheAdapter.get(keyName);
      expect(result).toBe(simpleValue);
    });

    it('should get an object set on a simple key', async () => {
      client.set<Object>(keyName, objectValue);
      const result = await nodeCacheAdapter.get(keyName);
      expect(result).toEqual(objectValue);
    });

    it('should get an array set on a simple key', async () => {
      client.set<any[]>(keyName, arrayValue);
      const result = await nodeCacheAdapter.get(keyName);
      expect(result).toEqual(arrayValue);
    });

    it('should get a string set on a compound (x:y) key', async () => {
      client.set<string>(compoundCombined, simpleValue);
      const result = await nodeCacheAdapter.get<string>(compoundCombined);
      expect(result).toBe(simpleValue);
    });

    it('should get an object set on a compound (x:y) key', async () => {
      client.set<Object>(compoundCombined, objectValue);
      const result = await nodeCacheAdapter.get<Object>(compoundCombined);
      expect(result).toEqual(objectValue);
    });

    it('should get an array set on a compound (x:y) key', async () => {
      client.set<any[]>(compoundCombined, arrayValue);
      const result = await nodeCacheAdapter.get<any[]>(compoundCombined);
      expect(result).toEqual(arrayValue);
    });
  });

  describe('Delete tests', () => {
    it('should delete a set value', async () => {
      client.set<string>(keyName, simpleValue);
      await nodeCacheAdapter.del(keyName);

      expect(client.get(keyName)).toBeFalsy();
    });
  });

  describe('Delete full hash', () => {
    it('should delete a full hash', async () => {
      const hashKey = compoundCombined.split(':')[0];

      client.set<any>(compoundCombined, objectValue);
      const keys = await nodeCacheAdapter.keys(hashKey);
      expect(keys).toHaveLength(1);

      await nodeCacheAdapter.delHash(hashKey);

      const keysPostDelete = await nodeCacheAdapter.keys(hashKey);
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
          @Cacheable({ client: nodeCacheAdapter, hashKey: 'user', cacheKey: (x) => x[0] })
          async getId(id: string): Promise<string> {
            mockGetIdImplementation();

            return id;
          }

          @Cacheable({ client: nodeCacheAdapter, hashKey: 'userInt', cacheKey: (x) => x[0] })
          async getIntId(id: number): Promise<number> {
            mockGetIntIdImplementation();

            return id;
          }

          @Cacheable({ client: nodeCacheAdapter, hashKey: 'boolVal', cacheKey: (x) => x[0] })
          async getBoolValue(value: boolean): Promise<boolean> {
            mockGetBooleanValueImplementation();

            return value;
          }

          @Cacheable({ client: nodeCacheAdapter, hashKey: 'arrVal', cacheKey: (x) => x[0] })
          async getArrayValue(value: string): Promise<any[]> {
            mockGetArrayValueImplementation();

            return ['true', true, 'false', false, 1, '1'];
          }

          @Cacheable({ client: nodeCacheAdapter, hashKey: 'objVal', cacheKey: (x) => x[0] })
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

  afterEach(() => {
    client.flushAll();
  });
});
