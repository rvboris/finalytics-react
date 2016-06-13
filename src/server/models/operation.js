import mongoose from 'mongoose';
import moment from 'moment';

const model = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  account: { type: mongoose.Schema.Types.ObjectId, ref: 'Account', required: true },
  type: { type: String, enum: ['expense', 'income'], required: true },
  category: { type: mongoose.Schema.Types.ObjectId, required: true },
  amount: { type: Number, required: true },
  balance: { type: Number, required: true },
  dayBalance: { type: Number },
  transfer: { type: mongoose.Schema.Types.ObjectId, ref: 'Transfer' },
  meta: { type: mongoose.Schema.Types.Mixed },
  created: { type: Date, required: true },
  updated: { type: Date, required: true },
});

model.pre('validate', async function preValidate(next) {
  this.updated = moment.utc();
  this.balance = 0;

  next();
});

export default mongoose.model('Operation', model);
