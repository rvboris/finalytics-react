import mongoose from 'mongoose';
import moment from 'moment';
import big from 'big.js';

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

  const operationsToUpdate = await OperationModel.find({
    created: {
      $gte: fromDate,
    },
    account: accountId,
    user: userId,
  }, '_id amount').sort({ created: 1 });

  operationsToUpdate.forEach(async (operation) => {
    currentBalance = currentBalance.plus(operation.amount);

    operation.balance = parseFloat(currentBalance.toFixed(currency.decimalDigits));

    await OperationModel.findByIdAndUpdate(operation._id, {
      $set: {
        balance: parseFloat(currentBalance.toFixed(currency.decimalDigits)),
      },
    });
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

      if (this.transfer.amount && this.transfer.account) {
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
  const wasNew = operation.wasNew;

  operation = operation.toObject({ depopulate: true, version: false });

  try {
    if (wasNew) {
      const operationsAfter = await mongoose.model('Operation').count({
        created: {
          $gt: operation.created,
        },
        account: operation.account,
        user: operation.user,
      });

      if (operationsAfter > 0) {
        await model.statics
          .balanceCorrection(operation.user, operation.account, operation.created);
      } else {
        await AccountModel
          .update({ _id: operation.account }, { currentBalance: operation.balance });
      }

      next();
      return;
    }

    if (operation.amount === this._original.amount
        && operation.created === this._original.created
        && operation.account === this._original.account) {
      next();
      return;
    }

    const fromDate = this._original.created < operation.created
      ? this._original.created
      : operation.created;

    await model.statics.balanceCorrection(operation.user, operation.account, fromDate);

    if (!operation.account.equals(this._original.account)) {
      await model.statics.balanceCorrection(operation.user, this._original.account, fromDate);
    }

    next();
  } catch (e) {
    next(e);
  }
});

model.post('remove', async function postRemove(operation, next) {
  operation = operation.toObject({ depopulate: true, version: false });

  try {
    await model.statics.balanceCorrection(operation.user, operation.account, operation.created);
  } catch (e) {
    next(e);
    return;
  }

  next();
});

export default mongoose.model('Operation', model);
