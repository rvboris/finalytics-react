import mongoose from 'mongoose';
import moment from 'moment';
import big from 'big.js';
import { get } from 'lodash';

import AccountModel from './account';

const model = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  account: { type: mongoose.Schema.Types.ObjectId, ref: 'Account', required: true },
  type: { type: String, enum: ['expense', 'income', 'transfer'], required: true },
  category: { type: mongoose.Schema.Types.ObjectId, required: true },
  amount: { type: Number, required: true },
  balance: { type: Number, required: true },
  transfer: {
    account: { type: mongoose.Schema.Types.ObjectId, ref: 'Account', required: false },
    amount: { type: Number, required: false },
    balance: { type: Number, required: false },
  },
  meta: { type: mongoose.Schema.Types.Mixed },
  created: { type: Date, required: true },
  updated: { type: Date, required: true },
});

model.methods.isTransfer = function isTransfer() {
  return !!(this.type === 'transfer' ||
    (get(this, 'transfer.account', false) && get(this, 'transfer.amount', false)));
};

model.statics.calcBalance = async (accountId, amount) => {
  const account = await AccountModel.findById(accountId).populate('currency');
  const balance = big(account.currentBalance).plus(amount);

  return parseFloat(balance.toFixed(account.currency.decimalDigits));
};

model.statics.getLastBalance = async (userId, accountId, fromDate) => {
  const query = {
    created: {
      $lt: fromDate,
    },
    user: userId,
  };

  const transferQuery = { 'transfer.account': accountId };

  Object.assign(transferQuery, query);

  query.account = accountId;

  const lastOperation = await mongoose.model('Operation')
    .findOne({ $or: [query, transferQuery] }, 'balance')
    .sort({ created: -1 });

  if (lastOperation) {
    return lastOperation.balance;
  }

  return (await AccountModel.findById(accountId, 'startBalance')).startBalance;
};

model.statics.isChanged = (op1, op2) => {
  const dateChanged = op1.created !== op2.created;

  if (dateChanged) {
    return true;
  }

  if (op1.isTransfer()) {
    return get(op1, 'transfer.amount', 0) !== get(op2, 'transfer.amount') ||
      get(op1, 'transfer.account', '').toString() !== get(op2, 'transfer.account', '').toString();
  }

  return op1.account.toString() !== op2.account.toString() || op1.amount !== op2.amount;
};

model.statics.balanceCorrection = async (userId, accountId, fromDate, startBalance) => {
  const OperationModel = mongoose.model('Operation');
  const { currency } = await AccountModel.findById(accountId, 'currency').populate('currency');

  let currentBalance =
    startBalance || await model.statics.getLastBalance(userId, accountId, fromDate);

  currentBalance = big(currentBalance);

  const query = {
    created: {
      $gte: fromDate,
    },
    user: userId,
  };

  const transferQuery = { 'transfer.account': accountId };

  Object.assign(transferQuery, query);

  query.account = accountId;

  const operationsToUpdate = await OperationModel.find({
    $or: [query, transferQuery],
  }, '_id amount type transfer').sort({ created: 1 });


  operationsToUpdate.forEach(async (operation) => {
    if (operation.isTransfer() && operation.transfer.account.equals(accountId)) {
      currentBalance = currentBalance.plus(operation.transfer.amount);
      operation.transfer.balance = parseFloat(currentBalance.toFixed(currency.decimalDigits));
      await OperationModel.findByIdAndUpdate(operation._id, {
        $set: {
          'transfer.balance': parseFloat(currentBalance.toFixed(currency.decimalDigits)),
        },
      });
    } else {
      currentBalance = currentBalance.plus(operation.amount);
      operation.balance = parseFloat(currentBalance.toFixed(currency.decimalDigits));
      await OperationModel.findByIdAndUpdate(operation._id, {
        $set: {
          balance: parseFloat(currentBalance.toFixed(currency.decimalDigits)),
        },
      });
    }
  });

  await AccountModel.findByIdAndUpdate(accountId, {
    $set: {
      currentBalance: parseFloat(currentBalance.toFixed(currency.decimalDigits)),
    },
  });
};

model.post('init', function postInit() {
  this._original = this.toObject({ version: false, depopulate: true });
});

model.pre('validate', async function preValidate(next) {
  this.updated = moment.utc();

  if (this.isNew) {
    try {
      this.balance = await model.statics.calcBalance(this.account, this.amount);

      if (this.isTransfer()) {
        this.transfer.balance =
          await model.statics.calcBalance(this.transfer.account, this.transfer.amount);
      }
    } catch (e) {
      next(e);
      return;
    }
  }

  next();
});

model.pre('save', function preSave(next) {
  this.wasNew = this.isNew;

  next();
});

model.post('save', async function postSave(operation, next) {
  const op = operation.toObject({ depopulate: true, version: false });

  try {
    if (operation.wasNew) {
      const query = {
        created: {
          $gt: op.created,
        },
        user: op.user,
      };

      const transferQuery = { 'transfer.account': op.account };

      Object.assign(transferQuery, query);

      query.account = op.account;

      const newer = await mongoose.model('Operation').count({ $or: [query, transferQuery] });

      if (newer) {
        await model.statics.balanceCorrection(op.user, op.account, op.created);

        if (operation.isTransfer()) {
          await model.statics.balanceCorrection(op.user, op.transfer.account, op.created);
        }
      } else {
        await AccountModel.update({ _id: op.account }, { currentBalance: op.balance });

        if (operation.isTransfer()) {
          await AccountModel
            .update({ _id: op.transfer.account }, { currentBalance: op.transfer.balance });
        }
      }

      next();
      return;
    }

    const transferUpdated = operation.isTransfer()
      && model.statics.isChanged(operation, this._original);

    if (!model.statics.isChanged(operation, this._original) && !transferUpdated) {
      next();
      return;
    }

    const fromDate = this._original.created < op.created ? this._original.created : op.created;

    await model.statics.balanceCorrection(op.user, op.account, fromDate);

    if (transferUpdated) {
      await model.statics.balanceCorrection(op.user, op.transfer.account, fromDate);
    }

    if (!op.account.equals(this._original.account)) {
      await model.statics.balanceCorrection(op.user, this._original.account, fromDate);
    }

    if (transferUpdated && !op.transfer.account.equals(this._original.transfer.account)) {
      await model.statics.balanceCorrection(op.user, this._original.transfer.account, fromDate);
    }

    next();
  } catch (e) {
    next(e);
  }
});

model.post('remove', async function postRemove(operation, next) {
  const op = operation.toObject({ depopulate: true, version: false });

  try {
    await model.statics.balanceCorrection(op.user, op.account, op.created);

    if (operation.isTransfer()) {
      await model.statics.balanceCorrection(op.user, op.transfer.account, op.created);
    }
  } catch (e) {
    next(e);
    return;
  }

  next();
});

export default mongoose.model('Operation', model);
