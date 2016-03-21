import Koa from 'koa';
import * as middlewares from './middlewares';
import config from '../shared/config';
import log, { error } from '../shared/log';
import { connect } from './models';

process.on('uncaughtException', error);

const createApp = () => {
  const app = new Koa();

  app.keys = config.sessionKeys;

  app.use(middlewares.responseTime);
  app.use(middlewares.hot);
  app.use(middlewares.errorHandler);
  app.use(middlewares.log);
  app.use(middlewares.assets);
  app.use(middlewares.session);
  app.use(middlewares.body);
  app.use(middlewares.passport);
  app.use(middlewares.etag);
  app.use(middlewares.helmet);
  app.use(middlewares.router);
  app.use(middlewares.renderer);

  const server = app.listen(config.port, () =>
    log(`app is started on port ${config.port}`));

  if (__DEVELOPMENT__) {
    if (module.hot) {
      module.hot.accept();

      module.hot.dispose(() => {
        server.close();
      });

      module.hot.addStatusHandler((status) => {
        if (status !== 'abort') {
          return;
        }

        setTimeout(() => process.exit(0), 0);
      });
    }
  }
};

(async () => {
  try {
    await connect();
  } catch (e) {
    return;
  }

  createApp();
})();
