import mongoose from 'mongoose';
import config from '../../shared/config';
import log, { error } from '../../shared/log';

const dbURI = `mongodb://${config.db.hostname}/${config.db.name}`;

mongoose.connect(dbURI);

mongoose.connection.on('connected', () => {
  log(`mongoose default connection open to ${dbURI}`);
});

mongoose.connection.on('error', (err) => {
  error(`mongoose default connection error: ${err.message}`);

  if (__DEVELOPMENT__) {
    error(err.stack);
  }
});

mongoose.connection.on('disconnected', () => {
  log('mongoose default connection disconnected');
});

process.on('SIGINT', () => {
  mongoose.connection.close(() => {
    log('mongoose default connection disconnected through app termination');
  });
});

export { default as UserModel } from './user';
