import {sqliteStore} from '@resolid/cache-manager-sqlite'
import * as cacheManager from 'cache-manager'
import {join} from 'node:path'

// On disk cache on caches table sync version
const store = sqliteStore({
  cacheTableName: 'caches',
  sqliteFile: join(process.cwd(), 'cache.sqlite3'),
})

const cache = cacheManager.createCache(store)

export default cache
export {cache, store}
