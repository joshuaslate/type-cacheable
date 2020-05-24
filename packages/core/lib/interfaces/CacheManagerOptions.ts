import { CacheStrategy } from './CacheStrategy';

export interface CacheManagerOptions {
  excludeContext?: boolean;
  ttlSeconds?: number;
  debug?: boolean;
  strategy?: CacheStrategy;
}
