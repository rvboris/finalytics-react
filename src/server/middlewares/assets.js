import convert from 'koa-convert';
import staticCache from 'koa-static-cache';
import config from '../../shared/config';

const getStaticPrefix = (isDev) =>
  isDev ? `http://${config.hostname}:${config.devPort}/assets/` : '/assets/';

const clientStatic = {
  path: '../client',
  prefix: getStaticPrefix(process.env.NODE_ENV === 'development'),
};

export default convert(staticCache(clientStatic.path, {
  maxAge: 365 * 24 * 60 * 60,
  prefix: clientStatic.prefix,
}));
