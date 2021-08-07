import { Cacheable, CacheClear } from '../../lib/decorators';
import { MockAdapter } from '../test-utils';

describe('CacheClear Decorator Tests', () => {
  it('should not throw an error if the client fails', async () => {
    const client = new MockAdapter();

    class TestClass {
      public aProp: string = 'aVal!';

      static setCacheKey = (args: any[]) => args[0];

      @Cacheable({ client, cacheKey: TestClass.setCacheKey })
      public async getProp(_id: string): Promise<any> {
        return this.aProp;
      }

      @CacheClear({ client, cacheKey: TestClass.setCacheKey })
      public async setProp(id: string, value: string): Promise<void> {
        this.aProp = value;
      }
    }

    client.get = async (_cacheKey: string) => {
      throw new Error('client failure');
    };

    client.set = async (_cacheKey: string, _value: any) => {
      throw new Error('client failure');
    };

    client.del = async (_cacheKey: string) => {
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
    const client = new MockAdapter();

    class TestClass {
      public aProp: string = 'aVal!';
      static setCacheKey = (args: any[]) => args[0];

      @Cacheable({ client, cacheKey: TestClass.setCacheKey })
      public async getProp(_id: string): Promise<any> {
        return this.aProp;
      }

      @CacheClear({ client, cacheKey: TestClass.setCacheKey })
      public async setProp(id: string, value: string): Promise<void> {
        this.aProp = value;
      }
    }

    const getSpy = jest.spyOn(client, 'get');
    const delSpy = jest.spyOn(client, 'del');
    const testInstance = new TestClass();

    await testInstance.getProp('1');
    await testInstance.setProp('1', 'anotherValue!');
    await testInstance.getProp('1');

    expect(delSpy).toHaveBeenCalledTimes(1);
    expect(getSpy).toHaveBeenCalledTimes(2);
  });

  it('should not clear a cached key when a CacheClear-decorated method throws', async () => {
    const client = new MockAdapter();

    class TestClass {
      public aProp: string = 'aVal!';
      static setCacheKey = (args: any[]) => args[0];

      @Cacheable({ client, cacheKey: TestClass.setCacheKey })
      public async getProp(_id: string): Promise<any> {
        return this.aProp;
      }

      @CacheClear({ client, cacheKey: TestClass.setCacheKey })
      public async setProp(_id: string, _value: string): Promise<void> {
        throw new Error();
      }
    }

    const getSpy = jest.spyOn(client, 'get');
    const delSpy = jest.spyOn(client, 'del');
    const testInstance = new TestClass();

    await testInstance.getProp('1');
    await expect(testInstance.setProp('1', 'anotherValue!')).rejects.toEqual(new Error);
    await testInstance.getProp('1');

    expect(delSpy).toHaveBeenCalledTimes(0);
    expect(getSpy).toHaveBeenCalledTimes(2);
  });

  it('should clear multiple cache keys', async () => {
    const client = new MockAdapter();
    const mockGetTodos = jest.fn();
    const mockGetTodo = jest.fn();

    class TestClass {
      public todos: any[] = [
        { id: '1', note: 'Todo' },
        { id: '2', note: 'Not todo' },
      ];
      static setCacheKey = (args: any[]) => args[0];

      @Cacheable({ client, cacheKey: 'todos' })
      public async getTodos(): Promise<any> {
        mockGetTodos();
        return this.todos;
      }

      @Cacheable({ client, cacheKey: TestClass.setCacheKey })
      public async getTodo(id: string): Promise<any> {
        mockGetTodo();
        return this.todos.find((todo) => todo.id === id);
      }

      @CacheClear({ client, cacheKey: (args: any[]) => ['todos', args[0]] })
      public async deleteTodo(id: string): Promise<any> {
        this.todos = this.todos.filter((todo) => todo.id !== id);
      }
    }

    const getSpy = jest.spyOn(client, 'get');
    const delSpy = jest.spyOn(client, 'del');
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
    const client = new MockAdapter();

    class TestClass {
      public todos: any[] = [
        { id: '1', note: 'Todo' },
        { id: '2', note: 'Not todo' },
      ];
      static setCacheKey = (args: any[]) => args[0];

      @Cacheable({ client, hashKey: 'todo', cacheKey: TestClass.setCacheKey })
      public async getTodo(id: string): Promise<any> {
        return this.todos.find((todo) => todo.id === id);
      }

      @CacheClear({ client, hashKey: 'todo' })
      public async deleteTodo(id: string): Promise<any> {
        this.todos = this.todos.filter((todo) => todo.id !== id);
      }
    }

    const testInstance = new TestClass();
    await testInstance.getTodo('1');
    await testInstance.getTodo('2');

    expect(await client.keys('')).toHaveLength(2);

    await testInstance.deleteTodo('1');

    expect(await client.keys('')).toHaveLength(0);
  });
});
