const webpackConfigFactory = require('./config-factory');

module.exports = (options = { env: 'development' }) =>
  webpackConfigFactory({ target: 'server', options });
