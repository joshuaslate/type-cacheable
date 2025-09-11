import type {
  CacheUpdateStrategy,
  CacheUpdateStrategyContext,
} from '../interfaces';

export class DefaultUpdateStrategy implements CacheUpdateStrategy {
  async handle(context: CacheUpdateStrategyContext): Promise<any> {
    try {
      await context.client.set(context.key, context.result, context.ttl);
    } catch (err) {
      if (context.fallbackClient) {
        try {
          await context.fallbackClient.set(
            context.key,
            context.result,
            context.ttl,
          );
        } catch (err) {}
      }

      if (context.debug) {
        console.warn(
          `type-cacheable CacheUpdate set cache failure on method ${
            context.originalMethod.name
          } due to client error: ${(err as Error).message}`,
        );
      }
    }

    return context.result;
  }
}
