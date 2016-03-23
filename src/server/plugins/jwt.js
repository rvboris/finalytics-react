import passport from 'koa-passport';

export default (ctx, next) =>
  passport.authenticate('jwt', async (user) => {
    if (user) {
      ctx.user = user;

      await next();
      return;
    }

    ctx.status = 403;
    ctx.session = null;
    ctx.body = { error: 'auth.login.error.password.invalid' };
  })(ctx, next);
