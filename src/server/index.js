import app from './app';
import config from '../shared/config';
import log from '../shared/log';

export { default as app } from './app';

(async () => {
  if (__TESTING__) {
    return;
  }

  const appInstance = await app();

  const server = appInstance.listen(config.port, () =>
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
})();
