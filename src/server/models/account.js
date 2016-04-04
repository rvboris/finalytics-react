import mongoose from 'mongoose';

const model = new mongoose.Schema({
  name: { type: String, required: true },
  currency: { type: mongoose.Schema.Types.ObjectId, ref: 'Currency', required: true },
  startBalance: { type: Number, required: true, default: 0 },
  currentBalance: { type: Number, required: true, default: 0 },
  status: { type: String, required: true, default: 'active', enum: ['active', 'closed'] },
  order: { type: Number, required: true, default: 0 },
  type: { type: String, required: true, default: 'standart', enum: ['standart', 'debt'] },
});

export default mongoose.model('Account', model);
