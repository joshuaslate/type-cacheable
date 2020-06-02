import { getCacheStrategy } from '../../lib/util';
import { DefaultStrategy } from '../../lib/strategies';

const mockArgs: any[] = [
  1,
  'two',
  function () {
    console.log('this is a test');
  },
];

describe('getCacheStrategy Tests', () => {
  it('should return the strategy, if a strategy is given', () => {
    const strategy = new DefaultStrategy();
    expect(getCacheStrategy(strategy, mockArgs)).toBe(strategy);
  });

  it('should return the value returned by a passed in CacheStrategyBuilder, if a fn is given', () => {
    const strategy = new DefaultStrategy();
    expect(
      getCacheStrategy((args) => {
        return strategy;
      }, mockArgs)
    ).toBe(strategy);
  });
});
