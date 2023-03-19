import 'reflect-metadata';

import CacheManager from './CacheManager';
export * from './decorators';
export * from './interfaces';
export * from './strategies';
export * from './util';

// Default export is a singleton that client and options are added to
export default new CacheManager();
