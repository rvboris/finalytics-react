import Koa from 'koa';
import * as middlewares from './middlewares';
import * as tasks from './tasks';
import config from '../shared/config';
import { error } from '../shared/log';
import { connect, disconnect, initData } from './models';
import { get } from 'lodash';

const createApp = (instance, jobs) => {
  const app = new Koa();

  app.keys = config.sessionKeys;
  app.instance = instance;

  app.shutdown = () => {
    disconnect();

    if (jobs.length) {
      jobs.forEach((job) => job.cancel());
    }
  };

  app.use(middlewares.assets);
  app.use(middlewares.session);
  app.use(middlewares.ctxLog(app.instance));
  app.use(middlewares.errorHandler);
  app.use(middlewares.httpLog);
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

  const instance = parseInt(get(process, 'env.pm_id', 0), 10);
  const jobs = instance === 0 ? await Promise.all(Object.values(tasks).map((task) => task())) : [];

  return createApp(instance, jobs);
};
