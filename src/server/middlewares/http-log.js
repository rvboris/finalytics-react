import morgan from 'koa-morgan';
import { Writable } from 'stream';

export default (ctx, next) => {
  const logStream = Writable({
    write(chunk, encoding, next) {
      ctx.log.request(chunk.toString('utf8', 0, chunk.length - 1));
      next();
    },
  });

  return morgan(__DEVELOPMENT__ ? 'dev' : 'short', { stream: logStream })(ctx, next);
};
