global.Promise = require('babel-runtime/core-js/promise').default = require('bluebird');

Promise.config({
  warnings: false,
  longStackTraces: true,
  cancellation: true,
  monitoring: true,
});

const index = require('./index');

export const app = index.app;
