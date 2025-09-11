export type CacheKeyDeleteBuilder<T = any[], U = any> = (
  args: T,
  context?: U,
) => string | string[];
