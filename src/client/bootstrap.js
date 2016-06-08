require('babel-runtime/core-js/promise').default = require('bluebird');

Promise.config({
  warnings: false,
  longStackTraces: true,
  cancellation: true,
  monitoring: true,
});

require('./app.js');
