# @type-cacheable/redis-adapter

TypeScript-based caching decorators to assist with caching (and clearing cache for) async methods. This package supports the `redis` client.

[View full documentation](https://github.com/joshuaslate/type-cacheable)

## Usage

### Installation

```bash
npm install --save @type-cacheable/core @type-cacheable/redis-adapter
```

Note: If you are using `redis` v3.x.x, use `@type-cacheable/redis-adapter` v10.x.x. If you are using `redis` v4.x.x, use `@type-cacheable/redis-adapter` v11.x.x+.

or

```bash
yarn add @type-cacheable/core @type-cacheable/redis-adapter
```

### Using adapter

```ts
import * as Redis from 'redis';
import { useAdapter } from '@type-cacheable/redis-adapter';

const client = Redis.createClient();
const clientAdapter = useAdapter(client);
```

Then you can rely on the `@Cacheable`, `@CacheUpdate`, and `@CacheClear` decorators from `@type-cacheable/core`. [See core documentation](https://github.com/joshuaslate/type-cacheable/tree/main/packages/core)
