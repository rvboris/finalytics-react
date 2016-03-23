import mongoose from 'mongoose';
import config from '../../shared/config';
import log, { error } from '../../shared/log';

const dbURI = `mongodb://${config.db.hostname}/${config.db.name}`;

export const connect = () =>
  mongoose.connect(dbURI).then(() => {
    log(`mongoose default connection open to ${dbURI}`);

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

export { default as UserModel } from './user';
export { default as ExchangeRateModel } from './exchange-rate';
