import Router from 'koa-66';
import { omit } from 'lodash';

import accountFixture from '../fixtures/account';
import { AccountModel, UserModel } from '../models';
import { error } from '../../shared/log';

const router = new Router();

router.get('/load', { jwt: true }, async (ctx) => {
  let accounts;

  if (ctx.user.accounts.length && ctx.user.status === 'init') {
    try {
      accounts = await UserModel.findById(ctx.user._id, 'accounts').populate('accounts').accounts;
    } catch (e) {
      error(e);
      ctx.status = 500;
      ctx.body = { error: e.message };
      return;
    }

    ctx.body = { accounts: accounts.map(account => omit(account, '__v')) };

    return;
  }

  accounts = accountFixture[ctx.user.settings.locale] || accountFixture.ru;

  accounts = accounts.map(account => {
    const model = new AccountModel(account);
    model.currency = ctx.user.settings.baseCurrency;
    model.save();
    return model;
  });

  try {
    accounts = await Promise.all(accounts);
  } catch (e) {
    error(e);
    ctx.status = 500;
    ctx.body = { error: e.message };
    return;
  }

  ctx.user.accounts.push(...accounts);

  try {
    await ctx.user.save();
  } catch (e) {
    error(e);
    ctx.status = 500;
    ctx.body = { error: e.message };
    return;
  }

  ctx.body = { accounts: accounts.map(account => omit(account, '__v')) };
});

router.post('/update', { jwt: true }, async (ctx) => {
  ctx.status = 200;
});

router.post('/add', { jwt: true }, async (ctx) => {
  ctx.status = 200;
});

router.post('/delete', { jwt: true }, async (ctx) => {
  ctx.status = 200;
});

export default router;
