if (process.env.CI) {
  module.exports.development = require('./ci');
} else {
  module.exports.development = require('./development');
  module.exports.production = require('./production');
}
