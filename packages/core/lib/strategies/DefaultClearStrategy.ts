import { CacheClearStrategy, CacheClearStrategyContext } from '../interfaces';

export class DefaultClearStrategy implements CacheClearStrategy {
  async handle(context: CacheClearStrategyContext): Promise<any> {
    try {
      if (context.isPattern) {
        // Delete keys that match a string pattern
        if (Array.isArray(context.key)) {
          const keys = (await Promise.all(context.key.map(context.client.keys))).reduce(
            (accum, curr) => [...accum, ...curr],
            [],
          );
          await context.client.del(keys);
        } else {
          await context.client.del(await context.client.keys(context.key));
        }
      } else {
        // Delete the requested value from cache
        await context.client.del(context.key);
      }
    } catch (err) {
      if (context.fallbackClient) {
        try {
          if (context.isPattern) {
            // Delete keys that match a string pattern
            if (Array.isArray(context.key)) {
              const keys = (await Promise.all(context.key.map(context.fallbackClient.keys))).reduce(
                (accum, curr) => [...accum, ...curr],
                [],
              );
              await context.fallbackClient.del(keys);
            } else {
              await context.fallbackClient.del(await context.fallbackClient.keys(context.key));
            }
          } else {
            // Delete the requested value from cache
            await context.fallbackClient.del(context.key);
          }
        } catch (err) {}
      }

      if (context.debug) {
        console.warn(`type-cacheable CacheClear failure due to client error: ${err.message}`);
      }
    }
  }
}
