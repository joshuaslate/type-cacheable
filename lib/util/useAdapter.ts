import { Redis as IoRedis } from 'ioredis';
import * as NodeCache from 'node-cache';
import { RedisClient } from 'redis';
import { IoRedisAdapter, NodeCacheAdapter, RedisAdapter } from '../adapters';
import cacheManager from '../index';

export const useRedisAdapter = (client: RedisClient): void => {
  const redisAdapter = new RedisAdapter(client);
  cacheManager.setClient(redisAdapter);
};

export const useIoRedisAdapter = (client: IoRedis): void => {
  const ioRedisAdapter = new IoRedisAdapter(client);
  cacheManager.setClient(ioRedisAdapter);
};

export const useNodeCacheAdapter = (client: NodeCache): void => {
  const nodeCacheAdapter = new NodeCacheAdapter(client);
  cacheManager.setClient(nodeCacheAdapter);
};
