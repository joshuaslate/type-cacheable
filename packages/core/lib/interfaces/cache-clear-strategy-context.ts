import type { CacheClient } from '.';

export interface CacheClearStrategyContext {
  debug: boolean | undefined;
  originalMethod: Function;
  originalMethodScope: any;
  originalMethodArgs: any[];
  originalPropertyKey: string;
  client: CacheClient;
  fallbackClient: CacheClient | null;
  isPattern?: boolean;
  key: string | string[];
  hashesToClear?: string | string[];
}
