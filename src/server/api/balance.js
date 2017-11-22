import Router from 'koa-66';
import mongoose from 'mongoose';
import { pick, isUndefined, isArray, get, isNaN } from 'lodash';
import money from 'money';
import big from 'big.js';

import { UserModel, CurrencyModel, OperationModel } from '../models';

const router = new Router();

const getDateBalanceForAccount = async (date, account) => {
  const operation = await OperationModel.findOne({
    $or: [
      {
        account: { $in: account },
        created: { $lte: date },
      },
      {
        'transfer.account': { $in: account },
        created: { $lte: date },
      },
    ],
  });

  if (!operation) {
    return 0;
  }

  return operation.account.equals(account)
    ? operation.balance
    : operation.transfer.balance;
};

router.get('/total', { jwt: true }, async (ctx) => {
  const params = pick(ctx.request.query, 'date', 'account');

  let getBalanceFromAccount = true;

  if (!isUndefined(params.date)) {
    if (isNaN(Date.parse(params.date))) {
      ctx.status = 400;
      ctx.body = { error: 'balance.total.error.date.invalid' };
      return;
    }

    getBalanceFromAccount = false;
  }

  if (!isUndefined(params.account)) {
    if (!isArray(params.account)) {
      params.account = [params.account];
    }

    if (params.account.some(account => !mongoose.Types.ObjectId.isValid(account))) {
      ctx.status = 400;
      ctx.body = { error: 'balance.total.error.account.invalid' };
      return;
    }

    if (!getBalanceFromAccount) {
      getBalanceFromAccount = true;
    }
  }

  const accountsQuery = {
    path: 'accounts',
    populate: { path: 'currency' },
  };

  if (getBalanceFromAccount && params.account) {
    accountsQuery.match = { _id: { $in: params.account } };
  }

  let accounts;
  let balance = [];

  try {
    ({ accounts } = (await UserModel.populate(ctx.user, accountsQuery)));

    balance = accounts.map(async account => ({
      value: getBalanceFromAccount
        ? account.currentBalance
        : await getDateBalanceForAccount(params.date, account._id),
      currencyCode: account.currency.code,
    }));

    balance = await Promise.all(balance);
  } catch (e) {
    ctx.log.error(e);
    ctx.status = 500;
    ctx.body = { error: e.message };
    return;
  }

  const baseCurrencyId = get(ctx, 'user.settings.baseCurrency');

  let baseCurrency;

  try {
    baseCurrency = await CurrencyModel.findById(baseCurrencyId);
  } catch (e) {
    ctx.log.error(e);
    ctx.status = 500;
    ctx.body = { error: e.message };
    return;
  }

  balance = balance.map(({ value, currencyCode }) =>
    currencyCode !== baseCurrency.code
      ? money(value).from(currencyCode).to(baseCurrency.code)
      : value);

  const total = balance
    .reduce((prev, value) => prev.plus(value), big(0))
    .toFixed(baseCurrency.decimalDigits);

  ctx.body = {
    total: parseFloat(total),
    currency: baseCurrencyId,
  };
});

export default router;
