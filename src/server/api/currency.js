import Router from 'koa-66';
import { get, omit } from 'lodash';

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

  const { settings: { locale } } = ctx.user.getProfile();

  ctx.body = {
    currencyList: currencyList.map(currency => {
      const currencyObject = currency.toObject({ versionKey: false });
      currencyObject.translatedName = get(currencyObject, `translate.${locale}.name`, currencyObject.name);
      return omit(currencyObject, ['translate']);
    }),
  };
});

export default router;
