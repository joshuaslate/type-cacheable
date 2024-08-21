export interface CacheKeyBuilder<T = any[], U = any> {
  (args: T, context?: U): string;
}
