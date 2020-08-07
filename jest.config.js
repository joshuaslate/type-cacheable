'use strict';

const baseConfig = require('./jest.config.base');

module.exports = {
  ...baseConfig,
  projects: ['<rootDir>/packages/*/jest.config.js'],
  collectCoverageFrom: ['<rootDir>/packages/*/lib/**/*.ts'],
  coverageDirectory: '<rootDir>/coverage/',
};
