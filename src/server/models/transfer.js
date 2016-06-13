import mongoose from 'mongoose';

const model = new mongoose.Schema({
  operations: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Operation' }],
});

export default mongoose.model('Transfer', model);
