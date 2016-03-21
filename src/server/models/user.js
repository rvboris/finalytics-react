import mongoose from 'mongoose';
import uniqueValidator from 'mongoose-unique-validator';
import isEmail from 'validator/lib/isEmail';
import moment from 'moment';

import config from '../../shared/config';

const crypto = require('crypto');
const randomBytes = Promise.promisify(crypto.randomBytes);
const pbkdf2 = Promise.promisify(crypto.pbkdf2);

const model = new mongoose.Schema({
  googleId: { type: String, unique: true },
  facebookId: { type: String, unique: true },
  twitterId: { type: String, unique: true },
  email: {
    type: String,
    validate: {
      validator: (v) => isEmail(v),
      message: 'auth.register.error.email.invalid',
    },
    unique: true,
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
    type: Object,
    required: false,
    default: {
      locale: config.defaultLang,
      timezone: 'Europe/Moscow',
    },
  },
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

model.pre('validate', function preValidate(next) {
  if (!this.created) {
    this.created = moment.utc();
  }

  this.updated = moment.utc();

  next();
});

model.plugin(uniqueValidator, { message: 'auth.register.error.{PATH}.unique' });

export default mongoose.model('User', model);
