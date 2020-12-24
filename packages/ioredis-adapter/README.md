# @type-cacheable/ioredis-adapter

TypeScript-based caching decorators to assist with caching (and clearing cache for) async methods. This package supports the `ioredis` client.

[View full documentation](https://github.com/joshuaslate/type-cacheable)

## Usage

### Installation

```bash
npm install --save @type-cacheable/core @type-cacheable/ioredis-adapter
```

or

```bash
yarn add @type-cacheable/core @type-cacheable/ioredis-adapter
```

### Using adapter

```ts
import * as IoRedis from 'ioredis';
import { useAdapter } from '@type-cacheable/ioredis-adapter';

const client = new IoRedis();
const clientAdapter = useAdapter(client);
```

Then you can rely on the `@Cacheable`, `@CacheUpdate`, and `@CacheClear` decorators from `@type-cacheable/core`. [See core documentation](https://github.com/joshuaslate/type-cacheable/tree/main/packages/core)
