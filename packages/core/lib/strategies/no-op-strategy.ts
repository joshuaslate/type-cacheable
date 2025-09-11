import type {
  CacheClearStrategy,
  CacheClearStrategyContext,
  CacheStrategy,
  CacheStrategyContext,
  CacheUpdateStrategy,
  CacheUpdateStrategyContext,
} from '../interfaces';

export class NoOpStrategy implements CacheStrategy {
  async handle(context: CacheStrategyContext): Promise<any> {
    return context.originalMethod!.apply(
      context.originalMethodScope,
      context.originalMethodArgs,
    );
  }
}

export class NoOpUpdateStrategy implements CacheUpdateStrategy {
  async handle(context: CacheUpdateStrategyContext): Promise<any> {
    return Promise.resolve(undefined);
  }
}

export class NoOpClearStrategy implements CacheClearStrategy {
  async handle(context: CacheClearStrategyContext): Promise<any> {
    return Promise.resolve(undefined);
  }
}
