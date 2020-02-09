import {RedisClient, Callback} from 'redis';
import {CacheClient} from '../interfaces';
import {parseIfRequired} from '../util';

// In order to support scalars in hmsets (likely not the intended use, but support has been requested),
// we need at least one key. We can use an empty string.
const SCALAR_KEY = '';

export class RedisAdapter implements CacheClient {

    static promisify = (resolve: Function, reject: Function): Callback<any> =>
        (err: any, response: any,) => {
            if (err) {
                reject(err);
            } else {
                resolve(response);
            }
        };

    static isScalar = (objectValue: any): boolean => {
        if (objectValue && typeof objectValue === 'object' &&
            Object.keys(objectValue).length === 1 && objectValue[SCALAR_KEY]) {
            return true;
        } else {
            return false;
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

        this.isReady();
    }

    /**
     * checkIfReady will return the last received ready status of the client.
     * If the client isn't ready, it will ping the redis client to check if it's ready
     * yet. This isn't a perfect solution, because we're not waiting for the response (so as to
     * not add latency to the underlying method calls). I believe it's a reasonable trade-off to
     * have a potential cache miss rather than add latency to all decorated method calls.
     */
    private isReady(): boolean {
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

        if (!this.isReady()) {
            throw new Error('Redis client is not accepting connections.');
        }

        return new Promise((resolve, reject) => {
            if (cacheKey.includes(':')) {
                this.redisClient.hgetall(cacheKey, RedisAdapter.promisify(resolve, reject));
            } else {
                this.redisClient.get(cacheKey, RedisAdapter.promisify(resolve, reject));
            }
        }).then((result: any) => {

            return result;
        });

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

        if (!this.isReady()) {
            throw new Error('Redis client is not accepting connections.');
        }


        return new Promise((resolve, reject) => {
            if (cacheKey.includes(':')) {


            } else {

            }
        });
    }


    public async del(keyOrKeys: string | string[]): Promise<any> {

        if (!this.isReady()) {
            throw new Error('Redis client is not accepting connections.');
        }

        return new Promise((resolve, reject) => {
            this.redisClient.del(keyOrKeys, RedisAdapter.promisify(resolve, reject));
        });
    }

    public async keys(pattern: string): Promise<string[]> {

        if (!this.isReady()) {
            throw new Error('Redis client is not accepting connections.');
        }

        return new Promise((resolve, reject) => {
            this.redisClient.scan(
                '0',
                'MATCH',
                `*${pattern}*`,
                'COUNT',
                '1000',
                RedisAdapter.promisify(resolve, reject),
            );
        });
    }
}
