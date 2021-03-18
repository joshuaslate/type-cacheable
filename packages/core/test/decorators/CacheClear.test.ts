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

  it('should not clear a cached key when a CacheClear-decorated method throws', async () => {
    class TestClass {
      public aProp: string = 'aVal!';
      static setCacheKey = (args: any[]) => args[0];

      @Cacheable({ cacheKey: TestClass.setCacheKey })
      public async getProp(id: string): Promise<any> {
        return this.aProp;
      }

      @CacheClear({ cacheKey: TestClass.setCacheKey })
      public async setProp(id: string, value: string): Promise<void> {
        throw new Error();
      }
    }

    const getSpy = jest.spyOn(cacheManager.client!, 'get');
    const delSpy = jest.spyOn(cacheManager.client!, 'del');
    const testInstance = new TestClass();

    await testInstance.getProp('1');
    await expect(testInstance.setProp('1', 'anotherValue!')).rejects.toEqual(new Error);
    await testInstance.getProp('1');

    expect(delSpy).toHaveBeenCalledTimes(0);
    expect(getSpy).toHaveBeenCalledTimes(2);
  });

  it('should clear multiple cache keys', async () => {
    const mockGetTodos = jest.fn();
    const mockGetTodo = jest.fn();

    class TestClass {
      public todos: any[] = [
        { id: '1', note: 'Todo' },
        { id: '2', note: 'Not todo' },
      ];
      static setCacheKey = (args: any[]) => args[0];

      @Cacheable({ cacheKey: 'todos' })
      public async getTodos(): Promise<any> {
        mockGetTodos();
        return this.todos;
      }

      @Cacheable({ cacheKey: TestClass.setCacheKey })
      public async getTodo(id: string): Promise<any> {
        mockGetTodo();
        return this.todos.find((todo) => todo.id === id);
      }

      @CacheClear({ cacheKey: (args: any[]) => ['todos', args[0]] })
      public async deleteTodo(id: string): Promise<any> {
        this.todos = this.todos.filter((todo) => todo.id !== id);
      }
    }

    const getSpy = jest.spyOn(cacheManager.client!, 'get');
    const delSpy = jest.spyOn(cacheManager.client!, 'del');
    const testInstance = new TestClass();

    await testInstance.getTodos();
    await testInstance.getTodo('1');
    await testInstance.deleteTodo('1');
    const postDeleteTodo = await testInstance.getTodo('1');
    await testInstance.getTodos();
    await testInstance.deleteTodo('1');

    expect(postDeleteTodo).toBeFalsy();

    expect(delSpy).toHaveBeenCalledWith(['todos', '1']);
    expect(getSpy).toHaveBeenCalledTimes(4);
    expect(mockGetTodos).toHaveBeenCalledTimes(2);
    expect(mockGetTodo).toHaveBeenCalledTimes(2);
  });

  it('should clear a full hash when a hashKey is provided, but no cacheKey is', async () => {
    class TestClass {
      public todos: any[] = [
        { id: '1', note: 'Todo' },
        { id: '2', note: 'Not todo' },
      ];
      static setCacheKey = (args: any[]) => args[0];

      @Cacheable({ hashKey: 'todo', cacheKey: TestClass.setCacheKey })
      public async getTodo(id: string): Promise<any> {
        return this.todos.find((todo) => todo.id === id);
      }

      @CacheClear({ hashKey: 'todo' })
      public async deleteTodo(id: string): Promise<any> {
        this.todos = this.todos.filter((todo) => todo.id !== id);
      }
    }

    const testInstance = new TestClass();
    await testInstance.getTodo('1');
    await testInstance.getTodo('2');

    expect(await cacheManager.client?.keys('')).toHaveLength(2);

    await testInstance.deleteTodo('1');

    expect(await cacheManager.client?.keys('')).toHaveLength(0);
  });
});
