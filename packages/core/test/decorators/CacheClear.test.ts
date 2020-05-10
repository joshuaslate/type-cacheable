import { Cacheable, CacheClear } from '../../lib/decorators';
import cacheManager from '../../lib';
import { useMockAdapter } from '../test-utils';

describe('CacheClear Decorator Tests', () => {
  beforeEach(() => {
    useMockAdapter();
  });

  it('should not throw an error if the client fails', async () => {
    class TestClass {
      public aProp: string = 'aVal!';

      static setCacheKey = (args: any[]) => args[0];

      @Cacheable({ cacheKey: TestClass.setCacheKey })
      public async getProp(id: string): Promise<any> {
        return this.aProp;
      }

      @CacheClear({ cacheKey: TestClass.setCacheKey })
      public async setProp(id: string, value: string): Promise<void> {
        this.aProp = value;
      }
    }

    cacheManager.client!.get = async (cacheKey: string) => {
      throw new Error('client failure');
    };

    cacheManager.client!.set = async (cacheKey: string, value: any) => {
      throw new Error('client failure');
    };

    cacheManager.client!.del = async (cacheKey: string) => {
      throw new Error('client failure');
    };

    const testInstance = new TestClass();
    let err;
    try {
      await testInstance.getProp('1');
      await testInstance.setProp('1', 'anotherValue!');
    } catch (error) {
      err = error;
    }

    expect(err).toBeFalsy();
  });

  it('should clear a cached key when a CacheClear-decorated method is called', async () => {
    class TestClass {
      public aProp: string = 'aVal!';

      static setCacheKey = (args: any[]) => args[0];

      @Cacheable({ cacheKey: TestClass.setCacheKey })
      public async getProp(id: string): Promise<any> {
        return this.aProp;
      }

      @CacheClear({ cacheKey: TestClass.setCacheKey })
      public async setProp(id: string, value: string): Promise<void> {
        this.aProp = value;
      }
    }

    const getSpy = jest.spyOn(cacheManager.client!, 'get');
    const delSpy = jest.spyOn(cacheManager.client!, 'del');
    const testInstance = new TestClass();

    await testInstance.getProp('1');
    await testInstance.setProp('1', 'anotherValue!');
    await testInstance.getProp('1');

    expect(delSpy).toHaveBeenCalledTimes(1);
    expect(getSpy).toHaveBeenCalledTimes(2);
  });
});
