import { Cacheable } from '../../lib/decorators';
import cacheManager, { CacheStrategy, CacheStrategyContext } from '../../lib';
import { useMockAdapter } from '../test-utils';

describe('Cacheable Decorator Tests', () => {
  beforeEach(() => {
    useMockAdapter();
  });

  it('should not throw an error if the client fails', async () => {
    class TestClass {
      public aProp: string = 'aVal!';

      @Cacheable()
      public async hello(): Promise<any> {
        return 'world';
      }
    }

    cacheManager.client!.get = async (cacheKey: string) => {
      throw new Error('client failure');
    };

    cacheManager.client!.set = async (cacheKey: string, value: any) => {
      throw new Error('client failure');
    };

    const testInstance = new TestClass();
    let err;
    try {
      await testInstance.hello();
    } catch (error) {
      err = error;
    }

    expect(err).toBeFalsy();
  });

  it('should attempt to get and set the cache on an initial call to a decorated method, only get on subsequent calls', async () => {
    class TestClass {
      public aProp: string = 'aVal!';

      @Cacheable()
      public async hello(): Promise<any> {
        return 'world';
      }
    }

    const getSpy = jest.spyOn(cacheManager.client!, 'get');
    const setSpy = jest.spyOn(cacheManager.client!, 'set');
    const testInstance = new TestClass();
    await testInstance.hello();

    // Because the cache hasn't been filled yet, a get and set should be called once each
    expect(getSpy).toHaveBeenCalledTimes(1);
    expect(setSpy).toHaveBeenCalledTimes(1);

    // With the same arguments, the setSpy should not be called again, but the getSpy should
    await testInstance.hello();

    expect(getSpy).toHaveBeenCalledTimes(2);
    expect(setSpy).toHaveBeenCalledTimes(1);
  });

  it('should use the provided strategy', async () => {
    class CustomStrategy implements CacheStrategy {
      async handle(context: CacheStrategyContext): Promise<any> {
        const result = await context.origianlFunction.apply(
          context.originalFunctionScope,
          context.originalFunctionArgs
        );
        return `hello ${result}`;
      }
    }

    class TestClass {
      public aProp: string = 'aVal!';

      @Cacheable({ strategy: new CustomStrategy() })
      public async hello(): Promise<any> {
        return 'world';
      }
    }

    const testInstance = new TestClass();
    const result = await testInstance.hello();

    expect(result).toEqual('hello world');
  });
});
