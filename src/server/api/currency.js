import Router from 'koa-66';

import { CurrencyModel } from '../models';

const router = new Router();

router.get('/load', { jwt: true }, async (ctx) => {
  let currencyList;

  try {
    currencyList = await CurrencyModel.find();
  } catch (e) {
    ctx.log.error(e);
    ctx.status = 500;
    ctx.body = { error: e.message };
    return;
  }

  ctx.body = {
    currencyList: currencyList.map(currency => {
      const currencyObject = currency.toObject({ versionKey: false });
      currencyObject.translatedName =
        currencyObject.translate[ctx.language].name || currencyObject.name;
      delete currencyObject.translate;
      return currencyObject;
    }),
  };
});

export default router;
