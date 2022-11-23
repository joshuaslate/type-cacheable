# @type-cacheable/lru-cache-adapter

[![npm downloads](https://img.shields.io/npm/dm/@type-cacheable/lru-cache-adapter)](https://www.npmjs.com/package/@type-cacheable/lru-cache-adapter)

TypeScript-based caching decorators to assist with caching (and clearing cache for) async methods. This package supports the `lru-cache` client.

[View full documentation](https://github.com/joshuaslate/type-cacheable)

## Usage

### Installation

```bash
npm install --save @type-cacheable/core @type-cacheable/lru-cache-adapter
```

or

```bash
yarn add @type-cacheable/core @type-cacheable/lru-cache-adapter
```

### Using adapter

```ts
import * as LRUCache from 'lru-cache';
import { useAdapter } from '@type-cacheable/lru-cache-adapter';

const client = new LRUCache();
const clientAdapter = useAdapter(client);
```

Then you can rely on the `@Cacheable`, `@CacheUpdate`, and `@CacheClear` decorators from `@type-cacheable/core`. [See core documentation](https://github.com/joshuaslate/type-cacheable/tree/main/packages/core)
