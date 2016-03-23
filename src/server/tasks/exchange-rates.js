import { Job } from 'node-schedule';
import human from 'human-to-cron';
import axios from 'axios';
import money from 'money';

import log, { error } from '../../shared/log';
import config from '../../shared/config';
import { ExchangeRateModel } from '../models';

const job = new Job('exchange-rates', async () => {
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
});

export default () => {
  // Each 3 hours
  job.schedule('0 0 */3 * * *');

  return job;
};
