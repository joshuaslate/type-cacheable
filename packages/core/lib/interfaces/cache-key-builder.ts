export type CacheKeyBuilder<T = any[], U = any> = (
  args: T,
  context?: U,
) => string;
