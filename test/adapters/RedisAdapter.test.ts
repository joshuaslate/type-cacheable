import * as Redis from 'redis';
import { RedisAdapter } from '../../lib/adapters';

let client: Redis.RedisClient;
let redisAdapter: RedisAdapter;

const keyName = 'aSimpleKey';
const compoundKey1 = 'aCompound';
const compoundKey2 = 'key';
const compoundExpire = RedisAdapter.getExpiresAtKey(compoundKey2);
const simpleValue = 'aSimpleValue';
const objectValue = { myKeyOne: 'myValOne' };
const arrayValue = ['element1', 2, { complex: 'element' }];

describe('RedisAdapter Tests', () => {
  beforeAll(() => {
    client = Redis.createClient();
    redisAdapter = new RedisAdapter(client);
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
        expect(result).toBe(JSON.stringify(objectValue));
      });
    });

    it('should set an array value on a standard key', async () => {
      await redisAdapter.set(keyName, arrayValue);

      client.get(keyName, (err, result) => {
        expect(result).toBe(JSON.stringify(arrayValue));
      });
    });

    it('should set a string value on a compound (x:y) key', async () => {
      await redisAdapter.set(`${compoundKey1}:${compoundKey2}`, simpleValue);

      client.hgetall(compoundKey1, (err, result) => {
        expect(result[compoundKey2]).toBe(simpleValue);
        expect(result[compoundExpire]).toBeFalsy();
      });
    });

    it('should set an object value on a compound (x:y) key', async () => {
      await redisAdapter.set(`${compoundKey1}:${compoundKey2}`, objectValue);

      client.hgetall(compoundKey1, (err, result) => {
        expect(result[compoundKey2]).toBe(JSON.stringify(objectValue));
        expect(result[compoundExpire]).toBeFalsy();
      });
    });

    it('should set an array value on a compound (x:y) key', async () => {
      await redisAdapter.set(`${compoundKey1}:${compoundKey2}`, arrayValue);

      client.hgetall(compoundKey1, (err, result) => {
        expect(result[compoundKey2]).toBe(JSON.stringify(arrayValue));
        expect(result[compoundExpire]).toBeFalsy();
      });
    });

    it('should set an expiresAt value on a compound (x:y) key when TTL is passed in', async () => {
      await redisAdapter.set(`${compoundKey1}:${compoundKey2}`, simpleValue, 150);

      client.hgetall(compoundKey1, (err, result) => {
        expect(result[compoundKey2]).toBe(simpleValue);
        expect(result[compoundExpire]).toBeTruthy();
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

    it('should get a string set on a compound (x:y) key', (done) => {
      client.hmset(compoundKey1, [compoundKey2, simpleValue], async (err, setResult) => {
        const result = await redisAdapter.get(`${compoundKey1}:${compoundKey2}`);
        expect(result).toBe(simpleValue);
        done();
      });
    });

    it('should get an object set on a compound (x:y) key', (done) => {
      client.hmset(compoundKey1, [compoundKey2, JSON.stringify(objectValue)], async (err, setResult) => {
        const result = await redisAdapter.get(`${compoundKey1}:${compoundKey2}`);
        expect(result).toEqual(objectValue);
        done();
      });
    });

    it('should get an array set on a compound (x:y) key', (done) => {
      client.hmset(compoundKey1, [compoundKey2, JSON.stringify(arrayValue)], async (err, setResult) => {
        const result = await redisAdapter.get(`${compoundKey1}:${compoundKey2}`);
        expect(result).toEqual(arrayValue);
        done();
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
