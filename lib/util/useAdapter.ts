import { RedisClient } from 'redis';
import * as NodeCache from 'node-cache';
import { RedisAdapter, NodeCacheAdapter } from '../adapters';
import cacheManager from '../index';

export const useRedisAdapter = (client: RedisClient): void => {
  const redisAdapter = new RedisAdapter(client);
  cacheManager.setClient(redisAdapter);
};

export const useNodeCacheAdapter = (client: NodeCache.NodeCache): void => {
  const nodeCacheAdapter = new NodeCacheAdapter(client);
  cacheManager.setClient(nodeCacheAdapter);
};
