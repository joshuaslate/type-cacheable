import * as IoRedis from 'ioredis';
import {IoRedisAdapter} from '../../lib/adapters';
import {fieldify, serializeValue} from "../../lib/util";
import {BasicDeserializer} from "../../lib/deserializers";

let client: IoRedis.Redis;
let ioRedisAdapter: IoRedisAdapter;

const keyName = 'aSimpleKey';
const keyName_2 = 'aSimpleKey2';
const compoundKey = 'aCompound:key';
const simpleValue = 'aSimpleValue';
const simpleNumber = 5;
const simpleBoolean = true;
const objectValue = {myKeyOne: 'myValOne'};
const arrayValue = ['element1', 2, 2.5, {complex: 'element'}, null, true];

describe('IoRedisAdapter Tests', () => {
  beforeAll(async () => {
    client = new IoRedis({lazyConnect:true});

    ioRedisAdapter = new IoRedisAdapter(client);
    return client.connect();
  });

  describe('Setter tests', () => {
    it('should set a string value on a standard key', async () => {
      await ioRedisAdapter.set(keyName, simpleValue);
      const result = await client.get(keyName);

      expect(result).toBe(serializeValue(simpleValue));
    });

    it('should set a number value on a standard key', async () => {
      await ioRedisAdapter.set(keyName, simpleNumber);
      const result = await client.get(keyName);

      expect(result).toBe(serializeValue(simpleNumber));
    });

    it('should set a null value on a standard key', async () => {
      await ioRedisAdapter.set(keyName, null);
      const result = await client.get(keyName);

      expect(result).toBe(serializeValue(null));
    });

    it('should set a boolean value on a standard key', async () => {
      await ioRedisAdapter.set(keyName, simpleBoolean);
      const result = await client.get(keyName);

      expect(result).toBe(serializeValue(simpleBoolean));
    });

    it('should set an object value on a standard key', async () => {
      await ioRedisAdapter.set(keyName, objectValue);
      const result = await client.get(keyName);

      expect(result).toBe(serializeValue(objectValue));
    });

    it('should set an array value on a standard key', async () => {
      await ioRedisAdapter.set(keyName, arrayValue);
      const result = await client.get(keyName);

      expect(result).toBe(serializeValue(arrayValue));
    });

    it('should set an object value on a compound (x:y) key', async () => {
      await ioRedisAdapter.set(compoundKey, objectValue);
      const result = await client.hgetall(compoundKey);

      expect(serializeValue(BasicDeserializer(result))).toEqual(serializeValue(objectValue));
    });

    it('should set an array value on a compound (x:y) key', async () => {
      await ioRedisAdapter.set(compoundKey, arrayValue);
      const result = await client.hgetall(compoundKey);

      expect(serializeValue(BasicDeserializer(result))).toEqual(serializeValue(arrayValue));
    });

    it('should set an expiresAt value on a compound (x:y) key when TTL is passed in', async () => {
      jest.spyOn(client, 'set');
      const ttl = 50000;
      await ioRedisAdapter.set(compoundKey, objectValue, ttl);

      expect(await client.ttl(compoundKey)).toBeGreaterThan(-1);
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

      expect(BasicDeserializer(result)).toEqual(objectValue);
    });

    it('should get an array set on a simple key', async () => {
      await client.set(keyName, JSON.stringify(arrayValue));
      const result = await ioRedisAdapter.get(keyName);

      expect(BasicDeserializer(result)).toEqual(arrayValue);
    });

    it('should get an object set on a compound (x:y) key', async () => {
      const args = fieldify(objectValue);
      await client.hmset(compoundKey, args);
      const result = await ioRedisAdapter.get(compoundKey);

      expect(BasicDeserializer(result)).toEqual(objectValue);
    });

    it('should get an array set on a compound (x:y) key', async () => {
      const args = fieldify(arrayValue);
      await client.hmset(compoundKey, args);
      const result = await ioRedisAdapter.get(compoundKey);

      expect(BasicDeserializer(result)).toEqual(arrayValue);
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
