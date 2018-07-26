import * as NodeCache from 'node-cache';
import { NodeCacheAdapter } from '../../lib/adapters';

let client: NodeCache.NodeCache;
let redisAdapter: NodeCacheAdapter;

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
    redisAdapter = new NodeCacheAdapter(client);
  });

  describe('Setter tests', () => {
    it('should set a string value on a standard key', async () => {
      await redisAdapter.set(keyName, simpleValue);

      client.get(keyName, (err, result) => {
        expect(result).toBe(simpleValue);
      });
    });

    it('should set an object value on a standard key', async () => {
      const keyName = 'aSimpleKey';

      await redisAdapter.set(keyName, objectValue);

      client.get(keyName, (err, result) => {
        expect(result).toEqual(objectValue);
      });
    });

    it('should set an array value on a standard key', async () => {
      await redisAdapter.set(keyName, arrayValue);

      client.get(keyName, (err, result) => {
        expect(result).toEqual(arrayValue);
      });
    });

    it('should set a string value on a compound (x:y) key', async () => {
      await redisAdapter.set(compoundCombined, simpleValue);

      client.get(compoundCombined, (err, result) => {
        expect(result).toBe(simpleValue);
      });
    });

    it('should set an object value on a compound (x:y) key', async () => {
      await redisAdapter.set(compoundCombined, objectValue);

      client.get(compoundCombined, (err, result) => {
        expect(result).toEqual(objectValue);
      });
    });

    it('should set an array value on a compound (x:y) key', async () => {
      await redisAdapter.set(compoundCombined, arrayValue);

      client.get(compoundCombined, (err, result) => {
        expect(result).toEqual(arrayValue);
      });
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
      client.set(keyName, objectValue, async (err, setResult) => {
        const result = await redisAdapter.get(keyName);
        expect(result).toEqual(objectValue);
        done();
      });
    });

    it('should get an array set on a simple key', (done) => {
      client.set(keyName, arrayValue, async (err, setResult) => {
        const result = await redisAdapter.get(keyName);
        expect(result).toEqual(arrayValue);
        done();
      });
    });

    it('should get a string set on a compound (x:y) key', (done) => {
      client.set(compoundCombined, simpleValue, async (err, setResult) => {
        const result = await redisAdapter.get(compoundCombined);
        expect(result).toBe(simpleValue);
        done();
      });
    });

    it('should get an object set on a compound (x:y) key', (done) => {
      client.set(compoundCombined, objectValue, async (err, setResult) => {
        const result = await redisAdapter.get(compoundCombined);
        expect(result).toEqual(objectValue);
        done();
      });
    });

    it('should get an array set on a compound (x:y) key', (done) => {
      client.set(compoundCombined, arrayValue, async (err, setResult) => {
        const result = await redisAdapter.get(compoundCombined);
        expect(result).toEqual(arrayValue);
        done();
      });
    });
  });

  afterEach(() => {
    client.flushAll();
  });
});
