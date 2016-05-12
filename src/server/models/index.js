import mongoose from 'mongoose';
import randomstring from 'randomstring';

import config from '../../shared/config';
import log, { error } from '../../shared/log';
import { currencyFixture } from '../fixtures';
import CurrencyModel from './currency';

const dbName = __TESTING__ ? `test-${randomstring.generate(5)}` : config.db.name;
const dbURI = `mongodb://${config.db.hostname}/${dbName}`;

export const connect = () =>
  mongoose.connect(dbURI).then(async () => {
    log(`mongoose default connection open to ${dbURI}`);

    const dropDatabase = __DEVELOPMENT__ || __TESTING__ || __E2E__;

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

    if (__DEVELOPMENT__) {
      error(err.stack);
    }
  });

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
