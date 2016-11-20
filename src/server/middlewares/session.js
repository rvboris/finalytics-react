import session from 'koa-generic-session';
import convert from 'koa-convert';
import MongooseStore from 'koa-session-mongoose';

export const cookieSettings = {
  path: '/',
  httpOnly: true,
  maxAge: 24 * 60 * 60 * 1000,
  rewrite: true,
  signed: true,
};

export const sessionPrefix = 'koa.sess.';
export const cookiePrefix = 'koa.sid';

export const store = new MongooseStore();

export default convert(session({
  store,
  cookie: cookieSettings,
  prefix: sessionPrefix,
  key: cookiePrefix,
}));
