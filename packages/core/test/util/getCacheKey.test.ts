import { getCacheKey } from '../../lib/util';

const mockArgs: any[] = [
  1,
  'two',
  function() { console.log('this is a test'); }
];

describe('getCacheKey Tests', () => {
  it('should return the string given as cacheKey, if a string is given', () => {
    expect(getCacheKey('myKey', 'myMethod', mockArgs)).toBe('myKey');
  });

  it('should return the value returned by a passed in CacheKeyBuilder as cacheKey, if a fn is given', () => {
    expect(getCacheKey(
      (args) => {
        return String(args.length);
      },
      'myMethod',
      mockArgs,
    )).toBe(String(mockArgs.length));
  });

  it('should return the md5 hash of serialized arguments when a cacheKey is not given', () => {
    expect(getCacheKey(undefined, 'myMethod', mockArgs)).toMatch((/[a-fA-F0-9]{32}/));
  });
});
