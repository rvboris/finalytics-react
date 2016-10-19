import axios from 'axios';
import money from 'money';
import schedule from 'node-schedule';
import moment from 'moment';
import { get } from 'lodash';

import { task, error } from '../../shared/log';
import config from '../../shared/config';
import { ExchangeRateModel } from '../models';
import ratesFixture from '../fixtures/rates';

const rule = new schedule.RecurrenceRule();
rule.hour = new schedule.Range(0, 24, 3);

const getFixture = () => {
  const fixture = ratesFixture;

  fixture.timestamp = new Date();
  fixture.disclaimer = 'fixture';
  fixture.license = 'fixture';

  return fixture;
};

export default () =>
  new Promise(async (resolve) => {
    task('shedule exchange rates updates');

    const job = schedule.scheduleJob(rule, async () => {
      task('exchange rates updating');

      let result;

      if (process.env.TEST || !get(config, 'openexchangerates.key')) {
        result = getFixture();
      } else {
        try {
          const { data } =
            await axios.get(config.openexchangerates.url + config.openexchangerates.key);
          result = data;
          result.timestamp = moment(result.timestamp).toDate();
        } catch (e) {
          error(e);
          result = getFixture();
        }
      }

      try {
        await ExchangeRateModel.remove({});

        const rates = new ExchangeRateModel(result);
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
