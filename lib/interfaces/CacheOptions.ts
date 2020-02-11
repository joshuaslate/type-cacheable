import {CacheClient, CacheDeserializer, CacheKeyBuilder, NoOpDeterminer, TTLBuilder} from './';

export interface CacheOptions {
  fieldKey?: string | CacheKeyBuilder;
  cacheKey?: string | CacheKeyBuilder;
  hashKey?: string | CacheKeyBuilder;
  client?: CacheClient;
  noop?: boolean | NoOpDeterminer;
  ttlSeconds?: number | TTLBuilder;
  deserializer?: boolean | CacheDeserializer;
}
