import { getTTL } from '../../lib/util';

const mockArgs: any[] = [
  1,
  'two',
  () => {
    console.log('this is a test');
  },
];

describe('getTTL Tests', () => {
  it('should return the number given as ttlSeconds, if a number is given', () => {
    expect(getTTL(10, mockArgs)).toBe(10);
  });

  it('should return the value returned by a passed in TTLBuilder as ttlSeconds, if a fn is given', () => {
    expect(
      getTTL((args) => {
        return args.length;
      }, mockArgs),
    ).toBe(mockArgs.length);
  });
});
