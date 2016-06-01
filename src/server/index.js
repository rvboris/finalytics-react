import app from './app';
import config from '../shared/config';
import log from '../shared/log';

export { default as app } from './app';

(async () => {
  let server;
  let appInstance;

  process.on('message', async (msg) => {
    switch (msg.cmd) {
      case 'stop':
        if (server) {
          server.close();
        }

        process.exit(0);
        break;
      case 'start':
        appInstance = await app();

        server = appInstance.listen(config.port, () =>
          log(`app is started on port ${config.port}`));

        if (process.send) {
          process.send({ cmd: 'started', ctx: config });
        }
        break;
      default:
    }
  });
})();
