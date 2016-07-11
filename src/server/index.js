global.Promise = require('babel-runtime/core-js/promise').default = require('bluebird');

Promise.config({
  warnings: false,
  longStackTraces: true,
  cancellation: true,
  monitoring: true,
});

const bootstrap = require('./bootstrap');

export const app = bootstrap.app;
export const server = bootstrap.server;
