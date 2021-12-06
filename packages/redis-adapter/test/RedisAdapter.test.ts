import * as Redis from 'redis';
import { Cacheable, CacheClear } from '@type-cacheable/core';
import { RedisAdapter, useAdapter } from '../lib';

let client: any
let redisAdapter: RedisAdapter;

const keyName = 'aSimpleKeyForRedis';
const simpleKeyKeys = 'anotherSimpleKeyForRedis';
const compoundKey = 'aCompound:keyForRedis';
const compoundKeyKeys = 'aCompound:keysForRedis';
const simpleValue = 'aSimpleValueForRedis';
const objectValue = { myKeyOne: 'myValOneForRedis' };
const arrayValue = ['element1', 2, { complex: 'elementForRedis' }];

describe('RedisAdapter Tests', () => {
  beforeAll(async () => {
    client = Redis.createClient();

    redisAdapter = useAdapter(client);
  });

  describe('Setter tests', () => {
    it('should set a string value on a standard key', (done) => {
      redisAdapter.set(keyName, simpleValue).then(async () => {
        await client.connect();

        const result = await client.get(keyName);
        expect(result).toBe(JSON.stringify(simpleValue));
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
