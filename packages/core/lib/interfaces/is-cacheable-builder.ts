export type IsCacheableBuilder<T = any, U = any[], V = any> = (
  value: T,
  args: U,
  context?: V,
) => boolean;
