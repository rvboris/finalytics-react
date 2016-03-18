import { error } from '../../shared/log';

export default async(ctx, next) => {
  try {
    await next();
  } catch (err) {
    error(err);

    ctx.body = __DEVELOPMENT__ ? err.stack : { error: 'global.error.technical' };
    ctx.status = err.status || 500;
  }
};
