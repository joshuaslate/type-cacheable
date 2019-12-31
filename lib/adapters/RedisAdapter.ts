import { RedisClient, Callback } from 'redis';
import { CacheClient } from '../interfaces';
import { parseIfRequired } from '../util';

export class RedisAdapter implements CacheClient {
  static buildSetArgumentsFromObject = (objectValue: any): string[] =>
    Object.keys(objectValue).reduce(
      (accum: any, curr: any) => {
        accum.push(
          curr,
          typeof objectValue[curr] === 'object'
            ? JSON.stringify(objectValue[curr])
            : objectValue[curr],
        );

        return accum;
      },
      [] as string[],
    );

  static responseCallback = (resolve: Function, reject: Function): Callback<any> => (
    err: any,
    response: any,
  ) => {
    if (err) {
      reject(err);
    } else {
      resolve(response);
    }
  };

  // The node_redis client
  private redisClient: RedisClient;

  private clientReady: boolean = false;
  private isPingingClient: boolean = false;

  constructor(redisClient: RedisClient) {
    this.redisClient = redisClient;
    this.clientReady = this.redisClient.ping();
    this.redisClient.on('ready', () => {
      this.clientReady = true;
    });
    this.redisClient.on('error', () => {
      this.clientReady = false;
    });

    this.checkIfReady();
  }

  /**
   * checkIfReady will return the last received ready status of the client.
   * If the client isn't ready, it will ping the redis client to check if it's ready
   * yet. This isn't a perfect solution, because we're not waiting for the response (so as to
   * not add latency to the underlying method calls). I believe it's a reasonable trade-off to
   * have a potential cache miss rather than add latency to all decorated method calls.
   */
  private checkIfReady(): boolean {
    if (!this.clientReady && !this.isPingingClient) {
      this.isPingingClient = true;
      this.redisClient.ping(() => {
        this.clientReady = true;
        this.isPingingClient = false;
      });
    }

    return this.clientReady;
  }

  // Redis doesn't have a standard TTL, it's at a per-key basis
  public getClientTTL(): number {
    return 0;
  }

  public async get(cacheKey: string): Promise<any> {
    const isReady = this.checkIfReady();

    if (isReady) {
      return new Promise((resolve, reject) => {
        if (cacheKey.includes(':')) {
          this.redisClient.hgetall(cacheKey, RedisAdapter.responseCallback(resolve, reject));
        } else {
          this.redisClient.get(cacheKey, RedisAdapter.responseCallback(resolve, reject));
        }
      }).then((result: any) => {
        const usableResult = parseIfRequired(result);
        if (
          usableResult &&
          typeof usableResult === 'object' &&
          Object.keys(usableResult).every(key => Number.isInteger(Number(key)))
        ) {
          return Object.keys(usableResult).map(key => parseIfRequired(usableResult[key]));
        }

        return usableResult;
      });
    }

    throw new Error('Redis client is not accepting connections.');
  }

  /**
   * set - Sets a key equal to a value in a Redis cache
   *
   * @param cacheKey The key to store the value under
   * @param value    The value to store
   * @param ttl      Time to Live (how long, in seconds, the value should be cached)
   *
   * @returns {Promise}
   */
  public async set(cacheKey: string, value: any, ttl?: number): Promise<any> {
    const isReady = this.checkIfReady();

    if (isReady) {
      return new Promise((resolve, reject) => {
        if (cacheKey.includes(':') && typeof value === 'object') {
          const args = RedisAdapter.buildSetArgumentsFromObject(value);

          this.redisClient.hmset(cacheKey, args, (err, result) => {
            if (!err) {
              // hmset doesn't add expiration by default, so we have to implement that here if ttl is given
              if (ttl) {
                this.redisClient.expire(
                  cacheKey,
                  ttl,
                  RedisAdapter.responseCallback(resolve, reject),
                );
                return;
              }
            }

            RedisAdapter.responseCallback(resolve, reject)(err, result);
          });
        } else {
          const usableValue = typeof value === 'string' ? value : JSON.stringify(value);

          if (ttl) {
            this.redisClient.set(
              cacheKey,
              usableValue,
              'EX',
              ttl,
              RedisAdapter.responseCallback(resolve, reject),
            );
          } else {
            this.redisClient.set(
              cacheKey,
              usableValue,
              RedisAdapter.responseCallback(resolve, reject),
            );
          }
        }
      });
    }

    throw new Error('Redis client is not accepting connections.');
  }

  public async del(keyOrKeys: string | string[]): Promise<any> {
    const isReady = this.checkIfReady();

    if (isReady) {
      return new Promise((resolve, reject) => {
        this.redisClient.del(keyOrKeys, RedisAdapter.responseCallback(resolve, reject));
      });
    }

    throw new Error('Redis client is not accepting connections.');
  }

  public async keys(pattern: string): Promise<string[]> {
    const isReady = this.checkIfReady();

    if (isReady) {
      return new Promise((resolve, reject) => {
        this.redisClient.scan('0', 'MATCH', `*${pattern}*`, 'COUNT', '1000', RedisAdapter.responseCallback(resolve, reject));
      });
    }

    throw new Error('Redis client is not accepting connections.');
  }
}
