import { CacheClient } from "./CacheClient";

export interface CacheClientBuilder<T = any[], U = any> {
  (args: T, context?: U): CacheClient;
}
