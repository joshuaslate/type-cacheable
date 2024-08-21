import { CacheClient } from "./cache-client";

export interface CacheClientBuilder<T = any[], U = any> {
  (args: T, context?: U): CacheClient;
}
