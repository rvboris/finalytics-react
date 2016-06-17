import mongoose from 'mongoose';
import moment from 'moment';

import OperationModel from './operation';

const model = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  currency: { type: mongoose.Schema.Types.ObjectId, ref: 'Currency', required: true },
  startBalance: { type: Number, required: true, default: 0 },
  currentBalance: { type: Number, required: true, default: 0 },
  status: { type: String, required: true, default: 'active', enum: ['active', 'closed'] },
  order: { type: Number, required: true, default: 0 },
  type: { type: String, required: true, default: 'standart', enum: ['standart', 'debt'] },
  created: { type: Date, required: true },
  updated: { type: Date, required: true },
});

model.pre('validate', async function preValidate(next) {
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

export default mongoose.model('Account', model);
