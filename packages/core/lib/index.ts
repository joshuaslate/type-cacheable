import 'reflect-metadata';

import CacheManager from './cache-manager';

export * from './decorators';
export * from './interfaces';
export * from './strategies';
export * from './util';

// Default export is a singleton that client and options are added to
export default new CacheManager();
