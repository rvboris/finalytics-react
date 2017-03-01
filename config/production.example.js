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

const availableLocales = [
  { key: 'ru', name: 'Русский' },
  { key: 'en', name: 'English' },
];

module.exports = {
  env: 'production',
  port,
  devPort: port + 10,
  loglevel: 'silly',
  defaultLocale: availableLocales[0].key,
  availableLocales,
  hostname,
  apiUrl,
  sessionKeys,
  tokenKeyFile: '/etc/keys/production-token-key.pem',
  db: {
    hostname,
    name: 'prod',
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
