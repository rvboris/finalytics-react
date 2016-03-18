export default async(ctx, next) => {
  if (__DEVELOPMENT__) {
    ctx.set('Connection', 'close');
  }

  await next();
};
