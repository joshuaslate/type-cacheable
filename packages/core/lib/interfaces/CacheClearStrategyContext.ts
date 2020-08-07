import { CacheClient } from '.';

export interface CacheClearStrategyContext {
  debug: boolean | undefined;
  originalMethod: Function;
  originalMethodScope: any;
  originalMethodArgs: any[];
  client: CacheClient;
  fallbackClient: CacheClient | null;
  isPattern?: boolean;
  key: string | string[];
  hashesToClear?: string | string[];
}
