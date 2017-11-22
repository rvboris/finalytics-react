import path from 'path';
import staticCache from 'koa-static-cache';
import config from '../../shared/config';

const currentPath = process.argv[1];

const getStaticPrefix = (isDev) =>
  isDev ? `http://${config.hostname}:${config.devPort}/assets/` : '/assets/';

const getStaticPath = (scriptPath) =>
  path.resolve(path.join(path.dirname(scriptPath), '..', 'client'));

const clientStatic = {
  path: getStaticPath(currentPath),
  prefix: getStaticPrefix(process.env.NODE_ENV === 'development'),
};

export default staticCache(clientStatic.path, {
  maxAge: 365 * 24 * 60 * 60,
  prefix: clientStatic.prefix,
});
