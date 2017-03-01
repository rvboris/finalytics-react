import Router from 'koa-66';
import { pick } from 'lodash';
import mongoose from 'mongoose';

import { CurrencyModel } from '../models';

const router = new Router();

router.get('/profile', { jwt: true }, (ctx) => {
  ctx.body = ctx.user.getProfile();
});

router.post('/settings', { jwt: true }, async (ctx) => {
  const params = pick(ctx.request.body, 'locale', 'timezone', 'baseCurrency');

  if (params.locale === 'auto') {
    params.locale = ctx.locale;
  }

  if (params.baseCurrency) {
    if (!mongoose.Types.ObjectId.isValid(params.baseCurrency)) {
      ctx.status = 400;
      ctx.body = { error: 'user.settings.error.baseCurrency.invalid' };
      return;
    }

    try {
      const baseCurrency = await CurrencyModel.findById(params.baseCurrency);

      if (!baseCurrency) {
        ctx.status = 400;
        ctx.body = { error: 'user.settings.error.baseCurrency.notFound' };
        return;
      }

      params.baseCurrency = baseCurrency._id;
    } catch (e) {
      ctx.log.error(e);
      ctx.status = 500;
      ctx.body = { error: e.message };
      return;
    }
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

  const { settings } = ctx.user.getProfile();

  ctx.body = settings;
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
