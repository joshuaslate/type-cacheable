import { CacheClient } from '.';

export interface CacheUpdateStrategyContext {
  debug: boolean | undefined;
  originalMethod: Function;
  originalMethodScope: any;
  originalMethodArgs: any[];
  originalPropertyKey: string;
  client: CacheClient;
  fallbackClient: CacheClient | null;
  key: string;
  ttl: number | undefined;
  result?: any;
}
