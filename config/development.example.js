const port = 3000;
const hostname = 'localhost';
const apiUrl = `http://${hostname}:${port}/api`;

const sessionKeys = [
  '1',
  '2',
  '3',
  '4',
  '5',
];

module.exports = {
  env: 'development',
  port,
  devPort: port + 10,
  loglevel: 'silly',
  defaultLang: 'ru',
  hostname,
  apiUrl,
  sessionKeys,
  tokenKeyFile: '/etc/keys/development-token-key.pem',
  db: {
    hostname,
    name: 'dev',
  },
  facebook: {
    clientId: '',
    clientSecret: '',
  },
  google: {
    clientId: '',
    clientSecret: '',
  },
  twitter: {
    clientId: '',
    clientSecret: '',
  },
  openexchangerates: {
    key: '',
    url: 'http://openexchangerates.org/api/latest.json?app_id=',
  },
};
