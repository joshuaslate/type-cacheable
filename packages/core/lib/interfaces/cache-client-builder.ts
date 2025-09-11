import type { CacheClient } from './cache-client';

export type CacheClientBuilder<T = any[], U = any> = (
  args: T,
  context?: U,
) => CacheClient;
