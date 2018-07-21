import { RedisClient } from 'redis';
import { RedisAdapter } from '../adapters';
import cacheManager from '../index';

export const useRedisAdapter = (client: RedisClient): void => {
  const redisAdapter = new RedisAdapter(client);
  cacheManager.setClient(redisAdapter);
};
