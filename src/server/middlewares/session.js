import session from 'koa-session';
import SessionStore from '../utils/session-store';

export const cookieSettings = {
  path: '/',
  httpOnly: true,
  maxAge: 24 * 60 * 60 * 1000,
  rewrite: true,
  signed: true,
};

export const sessionPrefix = 'koa.sess.';
export const cookiePrefix = 'koa.sid';

export const store = new SessionStore();

export default (app) => session({
  store,
  rolling: true,
  cookie: cookieSettings,
  prefix: sessionPrefix,
  key: cookiePrefix,
}, app);
