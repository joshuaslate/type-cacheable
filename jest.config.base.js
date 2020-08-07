module.exports = {
  transform: { '^.+\\.ts?$': 'ts-jest' },
  moduleFileExtensions: ['ts', 'js', 'node'],
  moduleNameMapper: { '^@type-cacheable/(.*)$': '<rootDir>/packages/$1' },
};
