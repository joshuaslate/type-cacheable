import CacheManager from './CacheManager';
export * from './adapters';
export * from './decorators';
export * from './interfaces';
export * from './util';

// Default export is a singleton that client and options are added to
export default new CacheManager();
