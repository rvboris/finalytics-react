import mongoose from 'mongoose';
import Chance from 'chance';
import { get } from 'lodash';

import config from '../../shared/config';
import log, { error, db } from '../../shared/log';
import { currencyFixture } from '../fixtures';
import CurrencyModel from './currency';

const chance = new Chance();

const dbName = get(process, 'env.TEST') || get(process, 'env.E2E')
  ? `test-${chance.word({ syllables: 3 })}`
  : config.db.name;

const dbURI = `mongodb://${config.db.hostname}/${dbName}`;

const connectOptions = {
  promiseLibrary: Promise,
};

mongoose.Promise = Promise;

mongoose.set('debug', (coll, method, query, doc, options) => {
  db(`${coll}.${method}(${JSON.stringify(query)}, ${JSON.stringify(options)});`);
});

export const connect = () =>
  mongoose.connect(dbURI, connectOptions).then(async () => {
    log(`mongoose default connection open to ${dbURI}`);

    const dropDatabase =
      process.env.NODE_ENV === 'development' ||
      get(process, 'env.TEST') ||
      get(process, 'env.E2E');

    if (dropDatabase) {
      log('mongoose drop database');
      await mongoose.connection.db.dropDatabase();
    }

    process.on('exit', async () => {
      if (dropDatabase) {
        log('mongoose drop test database');
        await mongoose.connection.db.dropDatabase();
      }
    });
  }, (err) => {
    error(`mongoose default connection error: ${err.message}`);

    if (process.env.NODE_ENV === 'development') {
      error(err.stack);
    }
  });

export const disconnect = () => {
  mongoose.disconnect();
};

export const initData = async () => {
  log('mongoose load initital data');

  try {
    const currencyCount = await CurrencyModel.count();

    if (!currencyCount) {
      log('mongoose load currency fixture');
      await CurrencyModel.insertMany(currencyFixture);
    }
  } catch (e) {
    error(e);
  }
};

export { default as UserModel } from './user';
export { default as ExchangeRateModel } from './exchange-rate';
export { default as CurrencyModel } from './currency';
export { default as AccountModel } from './account';
export { default as CategoryModel } from './category';
export { default as OperationModel } from './operation';
