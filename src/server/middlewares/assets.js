import convert from 'koa-convert';
import staticCache from 'koa-static-cache';
import clientConfigBuilder from '../../../webpack/client-config';

const webpackClientConfig = clientConfigBuilder({ mode: process.env.NODE_ENV });

export default convert(staticCache(webpackClientConfig.output.path, {
  maxAge: 365 * 24 * 60 * 60,
  prefix: webpackClientConfig.output.publicPath,
}));
