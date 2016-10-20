if (process.env.CI) {
  module.exports.ci = require('./ci');
} else {
  module.exports.development = require('./development');
  module.exports.production = require('./production');
}
