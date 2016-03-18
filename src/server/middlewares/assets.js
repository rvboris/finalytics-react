import convert from 'koa-convert';
import staticCache from 'koa-static-cache';

let middleware = async (ctx, next) => {
  await next();
};

if (__PRODUCTION__) {
  middleware = convert(staticCache('./build/assets', {
    maxAge: 365 * 24 * 60 * 60,
    prefix: '/assets/',
  }));
}

export default middleware;
