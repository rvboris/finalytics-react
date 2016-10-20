const example = require('./development.example');

module.exports = Object.assign({}, example, {
  facebook: {
    clientId: 'test',
    clientSecret: 'test',
  },
  google: {
    clientId: 'test',
    clientSecret: 'test',
  },
  twitter: {
    clientId: 'test',
    clientSecret: 'test',
  },
});
