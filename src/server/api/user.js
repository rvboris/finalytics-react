import Router from 'koa-66';
import { pick, assign } from 'lodash';

import { error } from '../../shared/log';

const router = new Router();

router.get('/profile', { jwt: true }, (ctx) => {
  ctx.body = pick(ctx.user, ['email', 'settings', 'status']);
});

router.post('/settings', { jwt: true }, async (ctx) => {
  const filteredObject = pick(ctx.request.body, ['locale', 'timezone']);

  if (filteredObject.locale === 'auto') {
    filteredObject.locale = ctx.language;
  }

  ctx.user.settings = assign(ctx.user.settings, filteredObject);
  ctx.user.markModified('settings');

  try {
    await ctx.user.save();
  } catch (e) {
    error(e);
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
    error(e);
    ctx.status = 500;
    ctx.body = { error: e.message };
    return;
  }

  ctx.body = { status: ctx.request.body.status };
});

export default router;
