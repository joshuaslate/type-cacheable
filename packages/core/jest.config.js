const baseConfig = require('../../jest.config.base');
const packageName = require('./package.json')
  .name.split('@type-cacheable/')
  .pop();

module.exports = {
  ...baseConfig,
  transform: {
    '^.+\\.ts?$': ['ts-jest', { tsconfig: `<rootDir>/packages/${packageName}/tsconfig.json` }],
  },
  displayName: packageName,
  rootDir: '../../',
  roots: [`<rootDir>/packages/${packageName}`],
  testRegex: `(packages/${packageName}/.*/__tests__/.*|\\.(test|spec))\\.(js?|ts?)$`,
};
