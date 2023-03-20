export interface IsCacheable<T = any> {
    (value: T): boolean;
  }