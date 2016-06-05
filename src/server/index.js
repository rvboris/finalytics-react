import { get } from 'lodash';

import app from './app';
import config from '../shared/config';
import log, { error } from '../shared/log';

export { default as app } from './app';

process.on('uncaughtException', error);

(async () => {
  if (get(process, 'env.TEST', false)) {
    log('test mode');
    return;
  }

  const appInstance = await app();
  const server = appInstance.listen(config.port, () =>
    log(`app-${appInstance.instance} is started on port ${config.port}`));

  if (process.send) {
    process.send({ cmd: 'started', ctx: config });
  }

  const stop = () => {
    log('stop signal');

    if (appInstance) {
      log('cleanup');
      appInstance.shutdown();
    }

    if (server) {
      log('close server');
      server.close();
    }

    log('exit');

    process.exit(0);
  };

  process.on('message', (msg) => {
    if (msg === 'shutdown') {
      stop();
    }
  });

  process.on('SIGINT', stop);
})();
