import { get } from 'lodash';

export default async(ctx, next) => {
  try {
    await next();
  } catch (err) {
    ctx.log.error(err);

    ctx.body = __DEVELOPMENT__ || get(process, 'env.TEST', false)
      ? err.stack
      : { error: 'global.error.technical' };

    ctx.status = err.status || 500;
  }
};
