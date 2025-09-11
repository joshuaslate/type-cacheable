export type PostRunKeyBuilder<T = any[], U = any, V = any> = (
  args: T,
  context?: U,
  returnValue?: V,
) => string;
