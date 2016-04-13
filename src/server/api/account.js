import Router from 'koa-66';
import mongoose from 'mongoose';
import { pick, merge } from 'lodash';

import accountFixture from '../fixtures/account';
import { AccountModel, UserModel } from '../models';
import { error } from '../../shared/log';

const router = new Router();

router.get('/load', { jwt: true }, async (ctx) => {
  let accounts;

  if (ctx.user.accounts.length && ctx.user.status === 'ready') {
    try {
      accounts = (await UserModel.populate(ctx.user, 'accounts')).accounts;
    } catch (e) {
      error(e);
      ctx.status = 500;
      ctx.body = { error: e.message };
      return;
    }

    ctx.body = { accounts: accounts.map(account => account.toObject({ versionKey: false })) };

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

  ctx.body = { accounts: accounts.map(account => account.toObject({ versionKey: false })) };
});

router.post('/update', { jwt: true }, async (ctx) => {
  const params = pick(ctx.request.body, '_id', 'name', 'startBalance', 'status', 'order');

  if (!params._id) {
    ctx.status = 400;
    ctx.body = { error: 'account.update.error._id.required' };
    return;
  }

  if (!mongoose.Types.ObjectId.isValid(params._id)) {
    ctx.status = 400;
    ctx.body = { error: 'account.update.error._id.invalid' };
    return;
  }

  try {
    const { accounts } = await UserModel.populate(ctx.user, 'accounts');
    const account = accounts.find(account => account._id.toString() === params._id);

    if (!account) {
      ctx.status = 400;
      ctx.body = { error: 'account.update.error._id.notFound' };
      return;
    }

    merge(account, params);
    await account.save();

    ctx.body = { accounts: accounts.map(account => account.toObject({ versionKey: false })) };
  } catch (e) {
    error(e);
    ctx.status = 500;
    ctx.body = { error: e.message };
  }
});

router.post('/add', { jwt: true }, async (ctx) => {
  ctx.status = 200;
});

router.post('/delete', { jwt: true }, async (ctx) => {
  ctx.status = 200;
});

export default router;
