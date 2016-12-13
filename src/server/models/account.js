import mongoose from 'mongoose';
import moment from 'moment';

import OperationModel from './operation';
import UserModel from './user';

const model = new mongoose.Schema({
  name: { type: String, required: true },
  currency: { type: mongoose.Schema.Types.ObjectId, ref: 'Currency', required: true },
  startBalance: { type: Number, required: true, default: 0 },
  currentBalance: { type: Number, required: true, default: 0 },
  status: { type: String, required: true, default: 'active', enum: ['active', 'closed'] },
  order: { type: Number, required: true, default: 0 },
  type: { type: String, required: true, default: 'standart', enum: ['standart', 'debt'] },
  created: { type: Date, required: true },
  updated: { type: Date, required: true },
});

model.post('init', function postInit() {
  this._original = this.toObject({ version: false, depopulate: true });
});

model.pre('validate', function preValidate(next) {
  if (!this.created) {
    this.created = moment.utc();
  }

  this.updated = moment.utc();

  next();
});

model.pre('remove', async function preRemove(next) {
  const account = this;

  try {
    await OperationModel.remove({
      $or: [
        { account },
        { 'transfer.account': account },
      ],
    });
  } catch (e) {
    next(e);
    return;
  }

  next();
});

model.pre('save', function preSave(next) {
  this.wasNew = this.isNew;

  next();
});

model.post('save', async function postSave(accountModel, next) {
  const wasNew = accountModel.wasNew;

  const account = accountModel.toObject({ depopulate: false, version: false });

  if (!wasNew && this._original.startBalance !== account.startBalance) {
    try {
      const user = await UserModel
        .findOne({ accounts: { $in: [account._id] } }, '_id');

      const query = { user: user._id, account: account._id };
      const transferQuery = { 'transfer.account': account._id };

      Object.assign(transferQuery, query);

      const firstOperation = await OperationModel
        .findOne({ $or: [query, transferQuery] }, 'created')
        .sort({ created: 1 });

      const fromDate = firstOperation ? firstOperation.created : account.created;

      await OperationModel.balanceCorrection(user._id, account._id, fromDate, account.startBalance);
    } catch (e) {
      next(e);
      return;
    }
  }

  next();
});

export default mongoose.model('Account', model);
