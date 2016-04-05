import mongoose from 'mongoose';
import uniqueValidator from 'mongoose-unique-validator';
import isEmail from 'validator/lib/isEmail';
import moment from 'moment';

import { error } from '../../shared/log';
import config from '../../shared/config';
import accountFixture from '../fixtures/account';
import CurrencyModel from './currency';
import AccountModel from './account';

const crypto = require('crypto');
const randomBytes = Promise.promisify(crypto.randomBytes);
const pbkdf2 = Promise.promisify(crypto.pbkdf2);

const model = new mongoose.Schema({
  status: { type: String, required: true, enum: ['ready', 'init'] },
  googleId: { type: String, index: { unique: true, sparse: true } },
  facebookId: { type: String, index: { unique: true, sparse: true } },
  twitterId: { type: String, index: { unique: true, sparse: true } },
  email: {
    type: String,
    validate: {
      validator: (v) => isEmail(v),
      message: 'auth.register.error.email.invalid',
    },
    unique: true,
    trim: true,
    required: 'auth.register.error.email.required',
  },
  password: {
    type: Buffer,
    required: 'auth.register.error.password.required',
  },
  created: {
    type: Date,
    required: 'auth.register.error.created.required',
  },
  updated: {
    type: Date,
    required: 'auth.register.error.updated.required',
  },
  settings: {
    type: mongoose.Schema.Types.Mixed,
    required: true,
    default: {
      locale: config.defaultLang,
    },
  },
  accounts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Account' }],
});

const encryptionConfig = {
  hashBytes: 32,
  saltBytes: 16,
  iterations: 743243,
};

model.methods.authenticate = async function authenticate(txt) {
  const saltBytes = this.password.readUInt32BE(0);
  const hashBytes = this.password.length - saltBytes - 8;
  const iterations = this.password.readUInt32BE(4);
  const salt = this.password.slice(8, saltBytes + 8);
  const hash = this.password.toString('binary', saltBytes + 8);

  const verify = await pbkdf2(txt, salt, iterations, hashBytes);

  return verify.toString('binary') === hash;
};

model.methods.setPassword = async function setPassword(txt, txtRepeat) {
  if (!txt) {
    return { error: 'auth.register.error.password.required' };
  }

  if (!txtRepeat) {
    return { error: 'auth.register.error.repeatPassword.required' };
  }

  if (txt !== txtRepeat) {
    return { error: 'auth.register.error.password.identical' };
  }

  if (txt.length < 8) {
    return { error: 'auth.register.error.password.short' };
  }

  this.password = await model.statics.encryptPassword(txt);

  return this.password;
};

model.statics.encryptPassword = async function encryptPassword(txt) {
  const salt = await randomBytes(encryptionConfig.saltBytes);
  const hash = await pbkdf2(
    txt,
    salt,
    encryptionConfig.iterations,
    encryptionConfig.hashBytes
  );

  const combined = new Buffer(hash.length + salt.length + 8);

  combined.writeUInt32BE(salt.length, 0, true);
  combined.writeUInt32BE(encryptionConfig.iterations, 4, true);

  salt.copy(combined, 8);
  hash.copy(combined, salt.length + 8);

  return combined;
};

model.pre('validate', async function preValidate(next) {
  if (!this.created) {
    this.created = moment.utc();
  }

  this.updated = moment.utc();

  const providers = ['twitterId', 'googleId', 'facebookId'];

  providers.forEach(provider => {
    if (!this[provider]) {
      this[provider] = undefined;
    }
  });

  if (!this.settings.baseCurrency) {
    const preferedCurrency = this.settings.locale === 'ru' ? 'RUB' : 'USD';

    let currency;

    try {
      currency = await CurrencyModel.findOne({ code: preferedCurrency });
      this.settings.baseCurrency = currency;
    } catch (e) {
      error(e);
      return;
    }

    if (!this.accounts.length) {
      let accounts = accountFixture[this.settings.locale] || accountFixture.ru;

      accounts = accounts.map(account => {
        const model = new AccountModel(account);
        model.currency = currency;
        model.save();
        return model;
      });

      try {
        accounts = await Promise.all(accounts);
      } catch (e) {
        error(e);
        return;
      }

      this.accounts.push(...accounts);
    }
  }

  if (!this.status) {
    this.status = 'init';
  }

  next();
});

model.plugin(uniqueValidator, { message: 'auth.register.error.{PATH}.unique' });

export default mongoose.model('User', model);
