import Router from 'koa-66';

import { CurrencyModel } from '../models';
import { error } from '../../shared/log';

const router = new Router();

router.get('/load', { jwt: true }, async (ctx) => {
  let currencyList;

  try {
    currencyList = await CurrencyModel.find();
  } catch (e) {
    error(e);
    ctx.status = 500;
    ctx.body = { error: e.message };
    return;
  }

  ctx.body = {
    currencyList: currencyList.map(currency => currency.toObject({ versionKey: false })),
  };
});

export default router;
