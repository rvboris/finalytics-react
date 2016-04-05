import morgan from 'koa-morgan';
import { Writable } from 'stream';

import { request } from '../../shared/log';

const logStream = Writable({
  write(chunk, encoding, next) {
    request(chunk.toString());
    next();
  },
});

export default morgan(__DEVELOPMENT__ ? 'dev' : 'short', { stream: logStream });
