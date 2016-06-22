
import Router from 'koa-66';
import mongoose from 'mongoose';
import { pick, merge } from 'lodash';
import big from 'big.js';

import accountFixture from '../fixtures/account';
import { AccountModel, UserModel, CurrencyModel } from '../models';

const router = new Router();

router.get('/load', { jwt: true }, async (ctx) => {
  let accounts;

  if (ctx.user.accounts.length || ctx.user.status === 'ready') {
    try {
      accounts = (await UserModel.populate(ctx.user, 'accounts')).accounts;
    } catch (e) {
      ctx.log.error(e);
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
    ctx.log.error(e);
    ctx.status = 500;
    ctx.body = { error: e.message };
    return;
  }

  ctx.user.accounts.push(...accounts);

  try {
    await ctx.user.save();
  } catch (e) {
    ctx.log.error(e);
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
    let { accounts } = await UserModel.populate(ctx.user, {
      path: 'accounts',
      populate: { path: 'currency' },
    });

    const account = accounts.find(account => account._id.equals(params._id));

    if (!account) {
      ctx.status = 400;
      ctx.body = { error: 'account.update.error._id.notFound' };
      return;
    }

    if (params.startBalance) {
      let startBalance;

      try {
        startBalance = big(params.startBalance);
      } catch (e) {
        ctx.log.error(e);
        ctx.status = 400;
        ctx.body = { error: 'account.update.error.startBalance.invalid' };
        return;
      }

      if (account.type === 'debt' && startBalance.gte(0)) {
        ctx.status = 400;
        ctx.body = { error: 'account.update.error.startBalance.positive' };
        return;
      }

      if (account.type === 'standart' && startBalance.lt(0)) {
        ctx.status = 400;
        ctx.body = { error: 'account.update.error.startBalance.negative' };
        return;
      }

      params.startBalance = parseFloat(startBalance.toFixed(account.currency.decimalDigits));
    }

    if (params.name && accounts.find(account => account.name === params.name)) {
      ctx.status = 400;
      ctx.body = { error: 'account.update.error.name.exist' };
      return;
    }

    merge(account, params);

    await account.save();

    accounts = await AccountModel.find({ _id: { $in: accounts } });

    ctx.body = { accounts: accounts.map(account => account.toObject({ versionKey: false })) };
  } catch (e) {
    ctx.log.error(e);
    ctx.status = 500;
    ctx.body = { error: e.message };
  }
});

router.post('/add', { jwt: true }, async (ctx) => {
  const params = pick(ctx.request.body, 'name', 'startBalance', 'order', 'type', 'currency');

  if (!params.name) {
    ctx.status = 400;
    ctx.body = { error: 'account.add.error.name.required' };
    return;
  }

  if (!params.startBalance) {
    ctx.status = 400;
    ctx.body = { error: 'account.add.error.startBalance.required' };
    return;
  }

  if (!params.type) {
    ctx.status = 400;
    ctx.body = { error: 'account.add.error.type.required' };
    return;
  }

  if (!params.currency) {
    ctx.status = 400;
    ctx.body = { error: 'account.add.error.currency.required' };
    return;
  }

  if (params.order) {
    try {
      big(params.order);
    } catch (e) {
      ctx.log.error(e);
      ctx.status = 400;
      ctx.body = { error: 'account.add.error.order.invalid' };
      return;
    }
  }

  try {
    params.startBalance = big(params.startBalance);
  } catch (e) {
    ctx.log.error(e);
    ctx.status = 400;
    ctx.body = { error: 'account.add.error.startBalance.invalid' };
    return;
  }

  if (!mongoose.Types.ObjectId.isValid(params.currency)) {
    ctx.status = 400;
    ctx.body = { error: 'account.add.error.currency.invalid' };
    return;
  }

  try {
    params.currency = await CurrencyModel.findById(params.currency);

    if (!params.currency) {
      ctx.status = 400;
      ctx.body = { error: 'account.add.error.currency.notFound' };
      return;
    }
  } catch (e) {
    ctx.log.error(e);
    ctx.status = 500;
    ctx.body = { error: e.message };
    return;
  }

  if (params.type === 'debt' && params.startBalance.gte(0)) {
    ctx.status = 400;
    ctx.body = { error: 'account.add.error.startBalance.positive' };
    return;
  }

  if (params.type === 'standart' && params.startBalance.lt(0)) {
    ctx.status = 400;
    ctx.body = { error: 'account.add.error.startBalance.negative' };
    return;
  }

  params.startBalance = parseFloat(params.startBalance.toFixed(params.currency.decimalDigits));
  params.currentBalance = params.startBalance;

  let accounts;

  try {
    accounts = (await UserModel.populate(ctx.user, 'accounts')).accounts;
  } catch (e) {
    ctx.log.error(e);
    ctx.status = 500;
    ctx.body = { error: e.message };
    return;
  }

  if (accounts.find(account => account.name === params.name)) {
    ctx.status = 400;
    ctx.body = { error: 'account.add.error.name.exist' };
    return;
  }

  const account = new AccountModel(params);

  account.currentBalance = params.startBalance;
  account.status = 'active';

  try {
    await account.save();

    ctx.user.accounts.push(account._id);

    await ctx.user.save();

    const { accounts } = await UserModel.populate(ctx.user, 'accounts');

    ctx.body = { accounts: accounts.map(account => account.toObject({ versionKey: false })) };
  } catch (e) {
    ctx.log.error(e);
    ctx.status = 500;
    ctx.body = { error: e.message };
  }
});

router.post('/delete', { jwt: true }, async (ctx) => {
  const { _id } = ctx.request.body;

  if (!_id) {
    ctx.status = 400;
    ctx.body = { error: 'account.delete.error._id.required' };
    return;
  }

  if (!mongoose.Types.ObjectId.isValid(_id)) {
    ctx.status = 400;
    ctx.body = { error: 'account.delete.error._id.invalid' };
    return;
  }

  try {
    let { accounts } = await UserModel.populate(ctx.user, 'accounts');

    const account = accounts.find(account => account._id.equals(_id));

    if (!account) {
      ctx.status = 400;
      ctx.body = { error: 'account.delete.error._id.notFound' };
      return;
    }

    account.remove();

    await ctx.user.save();

    accounts = (await UserModel.populate(ctx.user, 'accounts')).accounts;

    ctx.body = { accounts: accounts.map(account => account.toObject({ versionKey: false })) };
  } catch (e) {
    ctx.log.error(e);
    ctx.status = 500;
    ctx.body = { error: e.message };
  }
});

export default router;
