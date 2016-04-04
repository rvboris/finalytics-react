import mongoose from 'mongoose';

const model = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  account: { type: mongoose.Schema.Types.ObjectId, ref: 'Account', required: true },
  type: { type: String, enum: ['expense', 'income'], required: true },
  date: { type: Date, required: true },
  category: { type: mongoose.Schema.Types.ObjectId, required: true },
  amount: { type: Number, required: true },
  balance: { type: Number, required: true },
  dayBalance: { type: Number },
  groupTo: { type: mongoose.Schema.Types.ObjectId, req: 'Operation' },
});

export default mongoose.model('Operation', model);
