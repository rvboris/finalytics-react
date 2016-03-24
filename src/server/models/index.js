import mongoose from 'mongoose';
import config from '../../shared/config';
import log, { error } from '../../shared/log';
import { currencyFixture } from '../fixtures';
import CurrencyModel from './currency';

const dbURI = `mongodb://${config.db.hostname}/${config.db.name}`;

export const connect = () =>
  mongoose.connect(dbURI).then(async () => {
    log(`mongoose default connection open to ${dbURI}`);

    if (__DEVELOPMENT__) {
      log('mongoose drop database');
      await mongoose.connection.db.dropDatabase();
    }

    process.on('SIGINT', () => {
      mongoose.connection.close(() => {
        log('mongoose default connection disconnected through app termination');
      });
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
