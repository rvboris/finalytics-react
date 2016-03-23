import mongoose from 'mongoose';

const model = new mongoose.Schema({
  disclaimer: { type: String, required: true },
  license: { type: String, required: true },
  timestamp: { type: String, required: true },
  base: { type: String, required: true },
  rates: { type: mongoose.Schema.Types.Mixed, required: true },
});

export default mongoose.model('ExchangeRate', model);
