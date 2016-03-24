import later from 'later';
import axios from 'axios';
import money from 'money';

import log, { error } from '../../shared/log';
import config from '../../shared/config';
import { ExchangeRateModel } from '../models';

const shedule = later.parse.recur().every(3).hour();

export default () =>
  later.setInterval(async () => {
    log('exchange rates updating');

    let result;

    try {
      result = await axios.get(config.openexchangerates.url + config.openexchangerates.key);
    } catch (e) {
      error(e);
      return;
    }

    try {
      await ExchangeRateModel.remove({});

      const rates = new ExchangeRateModel(result.data);
      await rates.save();

      money.base = rates.base;
      money.rates = rates.rates;
    } catch (e) {
      error(e);
      return;
    }

    log('exchange rates finished updating');
  }, shedule);
