import Router from 'koa-66';

const router = new Router();

router.get('/profile', { jwt: true }, (ctx) => {
  ctx.body = {
    email: ctx.user.email,
    settings: ctx.user.settings,
  };
});

export default router;
