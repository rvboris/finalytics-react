import mongoose from 'mongoose';
import moment from 'moment';

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

export default mongoose.model('Account', model);
