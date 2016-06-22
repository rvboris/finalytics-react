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
  return this.transfer.account && this.transfer.amount;
};

model.statics.calcBalance = async (accountId, amount) => {
  const account = await AccountModel.findById(accountId).populate('currency');
  const balance = big(account.currentBalance).plus(amount);

  return parseFloat(balance.toFixed(account.currency.decimalDigits));
};

model.statics.getLastBalance = async (userId, accountId, fromDate) => {
  const lastOperation = await mongoose.model('Operation').findOne({
    created: {
      $lt: fromDate,
    },
    user: userId,
    account: accountId,
  }, 'balance').sort({ created: -1 });

  if (lastOperation) {
    return lastOperation.balance;
  }

  return (await AccountModel.findById(accountId, 'startBalance')).startBalance;
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
    account: accountId,
    user: userId,
  };

  const transferQuery = {
    transfer: {
      account: accountId,
    },
  };

  Object.assign(transferQuery, query);

  const operationsToUpdate = await OperationModel.find({
    $or: [query, transferQuery],
  }, '_id amount transfer').sort({ created: 1 });

  operationsToUpdate.forEach(async (operation) => {
    currentBalance = currentBalance.plus(operation.amount);

    if (operation.isTransfer() && operation.transfer.account.equal(accountId)) {
      operation.transfer.balance = parseFloat(currentBalance.toFixed(currency.decimalDigits));

      await OperationModel.findByIdAndUpdate(operation._id, {
        $set: {
          'transfer.balance': parseFloat(currentBalance.toFixed(currency.decimalDigits)),
        },
      });
    } else {
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
      const newer = await mongoose.model('Operation').count({
        created: {
          $gt: op.created,
        },
        account: op.account,
        user: op.user,
      });

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
        && get(op, 'transfer.account') === get(this._original, 'transfer.account')
        && get(op, 'transfer.amount') === get(this._original, 'transfer.amount');

    if (op.amount === this._original.amount
        && op.created === this._original.created
        && op.account === this._original.account
        && !transferUpdated) {
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
