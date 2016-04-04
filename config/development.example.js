const env = process.env.NODE_ENV || 'development';
const port = process.env.PORT || 3000;
const hotPort = parseInt(port, 10) + 1;
const hostname = process.env.HOSTNAME || 'localhost';
const apiUrl = `http://${hostname}:${port}/api`;

const sessionKeys = [
  '1',
  '2',
  '3',
  '4',
  '5',
];

export default ({
  env,
  port,
  hotPort,
  loglevel: 'silly',
  defaultLang: 'ru',
  hostname,
  apiUrl,
  sessionKeys,
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
});
