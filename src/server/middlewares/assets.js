import convert from 'koa-convert';
import staticCache from 'koa-static-cache';

export default __PRODUCTION__
  ? convert(staticCache('./build/assets', {
    maxAge: 365 * 24 * 60 * 60,
    prefix: '/assets/',
  }))
  : async (ctx, next) => { await next(); };
