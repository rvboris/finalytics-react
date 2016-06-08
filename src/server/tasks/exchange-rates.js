import axios from 'axios';
import money from 'money';
import schedule from 'node-schedule';

import { task, error } from '../../shared/log';
import config from '../../shared/config';
import { ExchangeRateModel } from '../models';

const rule = new schedule.RecurrenceRule();
rule.hour = new schedule.Range(0, 24, 3);

export default () =>
  new Promise(async (resolve) => {
    task('shedule exchange rates updates');

    const job = schedule.scheduleJob(rule, async () => {
      task('exchange rates updating');

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

      task('exchange rates finished updating');

      resolve(job);
    });

    job.invoke();
  });
