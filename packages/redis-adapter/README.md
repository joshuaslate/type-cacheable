# @type-cacheable/redis-adapter

TypeScript-based caching decorators to assist with caching (and clearing cache for) async methods. This package supports the `redis` client.

[View full documentation](https://github.com/joshuaslate/type-cacheable)

## Usage

### Installation

```bash
npm install --save @type-cacheable/core @type-cacheable/redis-adapter
```

or

```bash
yarn add @type-cacheable/core @type-cacheable/redis-adapter
```

### Using adapter

```ts
import * as Redis from 'redis';
import { useAdapter } from '@type-cacheable/redis-adapter';

const client = Redis.createClient();
useAdapter(client);
```

Then you can rely on the `@Cacheable`, `@CacheUpdate`, and `@CacheClear` decorators from `@type-cacheable/core`. [See core documentation](https://github.com/joshuaslate/type-cacheable/tree/master/packages/core)
