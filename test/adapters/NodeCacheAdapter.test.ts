import * as NodeCache from 'node-cache';
import {NodeCacheAdapter} from '../../lib/adapters';

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

  afterEach(() => {
    client.flushAll();
  });
});
