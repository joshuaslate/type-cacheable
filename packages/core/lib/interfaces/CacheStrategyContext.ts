import { CacheClient } from '.';

export interface CacheStrategyContext {
  debug: boolean | undefined;
  originalMethod: Function;
  originalMethodScope: any;
  originalPropertyKey: string;
  originalMethodArgs: any[];
  client: CacheClient;
  fallbackClient: CacheClient | null;
  key: string;
  ttl: number | undefined;
}
