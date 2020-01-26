import * as IoRedis from 'ioredis';
import { IoRedisAdapter } from '../../lib/adapters';

let client: IoRedis.Redis;
let ioRedisAdapter: IoRedisAdapter;

const keyName = 'aSimpleKey';
const keyName_2 = 'aSimpleKey2';
const compoundKey = 'aCompound:key';
const simpleValue = 'aSimpleValue';
const objectValue = { myKeyOne: 'myValOne' };
const arrayValue = ['element1', 2, { complex: 'element' }];

describe('IoRedisAdapter Tests', () => {
  beforeAll(async () => {
    client = new IoRedis();

    ioRedisAdapter = new IoRedisAdapter(client);
  });

  describe('Setter tests', () => {
    it('should set a string value on a standard key', async () => {
      await ioRedisAdapter.set(keyName, simpleValue);
      const result = await client.get(keyName);

      expect(result).toBe(simpleValue);
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

      expect(client.set).toHaveBeenCalledWith(compoundKey, JSON.stringify(objectValue), ['EX', ttl]);
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
      const result = await ioRedisAdapter.keys(compoundKey);

      expect(result).toHaveLength(1);
      expect(result).toContain(compoundKey);
    });

    it('should not found keys on a simple key', async () => {
      await client.set(compoundKey, simpleValue);

      const result = await ioRedisAdapter.keys(simpleValue);

      expect(result).toHaveLength(0);
      expect(result).toBeInstanceOf(Array);
    });
  });

  describe('Delete tests', () => {
    it('should delete one key', async () => {
      await client.set(keyName, simpleValue);
      await ioRedisAdapter.del(keyName);
      const result = await client.get(keyName);

      expect(result).toBeNull();
    });

    it('should not throw error on an empty array of keys', async done => {
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

  afterEach(async () => {
    await client.flushall();
  });

  afterAll(async () => {
    await client.quit();
  });
});
