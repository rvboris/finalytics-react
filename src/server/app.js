import 'source-map-support/register';
import 'babel-polyfill';

import Koa from 'koa';
import * as middlewares from './middlewares';
import * as tasks from './tasks';
import config from '../shared/config';
import { error } from '../shared/log';
import { connect, initData } from './models';

process.on('uncaughtException', error);

const createApp = () => {
  const app = new Koa();

  app.keys = config.sessionKeys;

  app.use(middlewares.errorHandler);
  app.use(middlewares.responseTime);
  app.use(middlewares.hot);
  app.use(middlewares.log);
  app.use(middlewares.assets);
  app.use(middlewares.session);
  app.use(middlewares.passport);
  app.use(middlewares.helmet);
  app.use(middlewares.etag);
  app.use(middlewares.body);
  app.use(middlewares.acceptLanguage);
  app.use(middlewares.renderer);
  app.use(middlewares.router);
  app.use(middlewares.errorMessage);

  return app;
};

export default async () => {
  try {
    await connect();
    await initData();
  } catch (e) {
    error(e);
    process.exit();
  }

  await Promise.all(Object.values(tasks).map((task) => task()));

  return createApp();
};
