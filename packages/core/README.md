# @type-cacheable/core

TypeScript-based caching decorators to assist with caching (and clearing cache for) async methods. Currently supports Redis (`redis`, `ioredis`), `lru-cache`, and `node-cache`. If you would like to see more adapters added, please open an issue or, better yet, a pull request with an implementation.

To learn how to set up an adapter for your cache of choice, [view the full documentation](https://github.com/joshuaslate/type-cacheable).

## Usage

### Installation

```bash
npm install --save @type-cacheable/core
```

or

```bash
yarn add @type-cacheable/core
```

### Adapter setup

You will need to set up the appropriate adapter for your cache of choice.

Redis:

- `redis` - `@type-cacheable/redis-adapter` - https://github.com/joshuaslate/type-cacheable/tree/master/packages/redis-adapter
- `ioredis` - `@type-cacheable/ioredis-adapter` - https://github.com/joshuaslate/type-cacheable/tree/master/packages/ioredis-adapter

LRU-Cache

- `lru-cache` - `@type-cacheable/lru-cache-adapter` - https://github.com/joshuaslate/type-cacheable/tree/master/packages/lru-cache-adapter

Node-Cache:

- `node-cache` - `@type-cacheable/node-cache-adapter` https://github.com/joshuaslate/type-cacheable/tree/master/packages/node-cache-adapter
