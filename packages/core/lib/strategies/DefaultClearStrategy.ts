import { CacheClearStrategy, CacheClearStrategyContext, CacheClient } from '../interfaces';

export class DefaultClearStrategy implements CacheClearStrategy {
  private handleDelete = async (client: CacheClient, context: CacheClearStrategyContext) => {
    // If hashesToClear is truthy, there is no individual cache keys to clear, so clear the provided hashes
    if (context.hashesToClear) {
      await client.delHash(context.hashesToClear);
    } else if (context.isPattern) {
      // Delete keys that match a string pattern
      if (Array.isArray(context.key)) {
        const keys = (await Promise.all(context.key.map(client.keys))).reduce(
          (accum, curr) => [...accum, ...curr],
          [],
        );
        await client.del(keys);
      } else {
        await client.del(await client.keys(context.key));
      }
    } else {
      // Delete the requested value from cache
      await client.del(context.key);
    }
  };

  async handle(context: CacheClearStrategyContext): Promise<any> {
    try {
      await this.handleDelete(context.client, context);
    } catch (mainClientError) {
      if (context.fallbackClient) {
        try {
          await this.handleDelete(context.fallbackClient, context);
        } catch (fallbackClientError) {
          if (context.debug) {
            console.warn(
              `type-cacheable CacheClear failure on method ${context.originalMethod.name} due to client error: ${mainClientError.message} and fallback client failure: ${fallbackClientError.message}`,
            );
          }
        }
        return;
      } else {
        if (context.debug) {
          console.warn(
            `type-cacheable CacheClear failure on method ${context.originalMethod.name} due to client error: ${mainClientError.message}`,
          );
        }
      }
    }
  }
}
