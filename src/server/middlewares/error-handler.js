export default async(ctx, next) => {
  try {
    await next();
  } catch (err) {
    ctx.log.error(err);

    ctx.body = process.env.NODE_ENV === 'development'
      ? err.stack
      : { error: 'global.error.technical' };

    ctx.status = err.status || 500;
  }
};
