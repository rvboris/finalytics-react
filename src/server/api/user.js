import Router from 'koa-66';
import { pick } from 'lodash';

const router = new Router();

router.get('/profile', { jwt: true }, (ctx) => {
  ctx.body = pick(ctx.user, 'email', 'settings', 'status');
});

router.post('/settings', { jwt: true }, async (ctx) => {
  const params = pick(ctx.request.body, 'locale', 'timezone');

  if (params.locale === 'auto') {
    params.locale = ctx.language;
  }

  Object.assign(ctx.user.settings, params);

  ctx.user.markModified('settings');

  try {
    await ctx.user.save();
  } catch (e) {
    ctx.log.error(e);
    ctx.status = 500;
    ctx.body = { error: e.message };
    return;
  }

  ctx.body = ctx.user.settings;
});

router.post('/status', { jwt: true }, async (ctx) => {
  try {
    ctx.user.status = ctx.request.body.status;
    await ctx.user.save();
  } catch (e) {
    ctx.log.error(e);
    ctx.status = 500;
    ctx.body = { error: e.message };
    return;
  }

  ctx.body = { status: ctx.user.status };
});

router.post('/delete', { jwt: true }, async (ctx) => {
  ctx.session = null;

  try {
    await ctx.user.remove();
  } catch (e) {
    ctx.log.error(e);
    ctx.status = 500;
    ctx.body = { error: e.message };
    return;
  }

  ctx.status = 200;
});

export default router;
