import Router from 'koa-66';
import mongoose from 'mongoose';
import big from 'big.js';
import TreeModel from 'tree-model';
import { pick, isUndefined, isArray, mapValues, remove, sortBy } from 'lodash';

import { OperationModel, UserModel, CategoryModel, TransferModel } from '../models';

const router = new Router();

const publicFields =
  ['_id', 'account', 'type', 'category', 'amount', 'balance', 'created'];

const filterProps = (operation) => {
  operation = pick(operation, ...publicFields);
  return mapValues(operation, (prop) => (prop._id ? prop._id.toString() : prop));
};

router.post('/add', { jwt: true }, async (ctx) => {
  const params = pick(ctx.request.body, 'created', 'account', 'category', 'amount');

  if (isUndefined(params.created)) {
    ctx.status = 400;
    ctx.body = { error: 'operation.add.error.created.required' };
    return;
  }

  if (isNaN(Date.parse(params.created))) {
    ctx.status = 400;
    ctx.body = { error: 'operation.add.error.created.invalid' };
    return;
  }

  if (isUndefined(params.account)) {
    ctx.status = 400;
    ctx.body = { error: 'operation.add.error.account.required' };
    return;
  }

  if (!mongoose.Types.ObjectId.isValid(params.account)) {
    ctx.status = 400;
    ctx.body = { error: 'operation.add.error.account.invalid' };
    return;
  }

  if (isUndefined(params.category)) {
    ctx.status = 400;
    ctx.body = { error: 'operation.add.error.category.required' };
    return;
  }

  if (!mongoose.Types.ObjectId.isValid(params.category)) {
    ctx.status = 400;
    ctx.body = { error: 'operation.add.error.category.invalid' };
    return;
  }

  if (isUndefined(params.amount)) {
    ctx.status = 400;
    ctx.body = { error: 'operation.add.error.amount.required' };
    return;
  }

  let account;

  try {
    const { accounts } = await UserModel.populate(ctx.user, {
      path: 'accounts',
      populate: { path: 'currency' },
      match: { _id: params.account },
    });

    if (!accounts.length) {
      ctx.status = 400;
      ctx.body = { error: 'operation.add.error.account.notFound' };
      return;
    }

    account = accounts[0];
  } catch (e) {
    ctx.log.error(e);
    ctx.status = 500;
    ctx.body = { error: e.message };
    return;
  }

  let amount;

  try {
    amount = big(params.amount);
  } catch (e) {
    ctx.status = 400;
    ctx.body = { error: 'operation.add.error.amount.invalid' };
    return;
  }

  const operation = new OperationModel(params);

  operation.type = amount.gt(0) ? 'income' : 'expense';
  operation.amount = parseFloat(amount.toFixed(account.currency.decimalDigits));
  operation.user = ctx.user;

  try {
    const { data: categoryData } = await CategoryModel.findOne({ user: ctx.user }, 'data');
    const tree = new TreeModel();
    const rootNode = tree.parse(categoryData);

    const categoryNode = rootNode
      .first(node => node.model._id.equals(params.category));

    if (!categoryNode) {
      ctx.status = 400;
      ctx.body = { error: 'operation.add.error.category.notFound' };
      return;
    }

    if (categoryNode.model.type !== 'any' && categoryNode.model.type !== operation.type) {
      ctx.status = 400;
      ctx.body = { error: 'operation.add.error.category.invalidType' };
      return;
    }
  } catch (e) {
    ctx.log.error(e);
    ctx.status = 500;
    ctx.body = { error: e.message };
    return;
  }

  try {
    await operation.save();
  } catch (e) {
    ctx.log.error(e);
    ctx.status = 500;
    ctx.body = { error: e.message };
    return;
  }

  ctx.body = filterProps(operation);
});

router.post('/delete', { jwt: true }, async (ctx) => {
  const { _id } = ctx.request.body;

  if (isUndefined(_id)) {
    ctx.status = 400;
    ctx.body = { error: 'operation.delete.error._id.required' };
    return;
  }

  if (!mongoose.Types.ObjectId.isValid(_id)) {
    ctx.status = 400;
    ctx.body = { error: 'operation.delete.error._id.invalid' };
    return;
  }

  try {
    const operation = await OperationModel.findById(_id);

    if (!operation) {
      ctx.status = 400;
      ctx.body = { error: 'operation.delete.error._id.notFound' };
      return;
    }

    await operation.remove();
  } catch (e) {
    ctx.log.error(e);
    ctx.status = 500;
    ctx.body = { error: e.message };
    return;
  }

  ctx.status = 200;
});

router.post('/update', { jwt: true }, async (ctx) => {
  const params = pick(ctx.request.body, '_id', 'created', 'account', 'category', 'amount');

  if (isUndefined(params._id)) {
    ctx.status = 400;
    ctx.body = { error: 'operation.update.error._id.required' };
    return;
  }

  if (!mongoose.Types.ObjectId.isValid(params._id)) {
    ctx.status = 400;
    ctx.body = { error: 'operation.update.error._id.invalid' };
    return;
  }

  if (params.created && isNaN(Date.parse(params.created))) {
    ctx.status = 400;
    ctx.body = { error: 'operation.update.error.created.invalid' };
    return;
  }

  if (params.account && !mongoose.Types.ObjectId.isValid(params.account)) {
    ctx.status = 400;
    ctx.body = { error: 'operation.update.error.account.invalid' };
    return;
  }

  if (params.category && !mongoose.Types.ObjectId.isValid(params.category)) {
    ctx.status = 400;
    ctx.body = { error: 'operation.update.error.category.invalid' };
    return;
  }

  let amount;

  if (params.amount) {
    try {
      amount = big(params.amount);
    } catch (e) {
      ctx.status = 400;
      ctx.body = { error: 'operation.update.error.amount.invalid' };
      return;
    }
  }

  let operation;
  let category;
  let categoryModel;
  let tree;
  let rootNode;

  try {
    operation = await OperationModel.findById(params._id).populate({
      path: 'account',
      populate: { path: 'currency' },
    });

    if (!operation) {
      ctx.status = 400;
      ctx.body = { error: 'operation.update.error._id.notFound' };
      return;
    }

    categoryModel = await CategoryModel.findOne({ user: ctx.user }, '_id data');

    tree = new TreeModel();
    rootNode = tree.parse(categoryModel.data);

    category = rootNode.first((node) =>
      node.model._id.equals(operation.category)).model;
  } catch (e) {
    ctx.log.error(e);
    ctx.status = 500;
    ctx.body = { error: e.message };
    return;
  }

  if (params.account) {
    try {
      const { accounts } = await UserModel.populate(ctx.user, {
        path: 'accounts',
        populate: { path: 'currency' },
        match: { _id: params.account },
      });

      if (!accounts.length) {
        ctx.status = 400;
        ctx.body = { error: 'operation.update.error.account.notFound' };
        return;
      }

      operation.account = accounts[0];
    } catch (e) {
      ctx.log.error(e);
      ctx.status = 500;
      ctx.body = { error: e.message };
      return;
    }
  }

  if (amount) {
    const operationType = amount.gt(0) ? 'income' : 'expense';

    operation.amount = parseFloat(amount.toFixed(operation.account.currency.decimalDigits));

    if (operationType !== operation.type && !params.category && category.type !== 'any') {
      ctx.status = 400;
      ctx.body = { error: 'operation.update.error.category.invalidType' };
      return;
    }

    operation.type = operationType;
  }

  if (params.category) {
    const categoryNode = rootNode.first((node) => node.model._id.equals(params.category));

    if (!categoryNode) {
      ctx.status = 400;
      ctx.body = { error: 'operation.update.error.category.notFound' };
      return;
    }

    if (categoryNode.model.type !== 'any' && categoryNode.model.type !== operation.type) {
      ctx.status = 400;
      ctx.body = { error: 'operation.update.error.category.invalidType' };
      return;
    }

    operation.category = categoryNode.model._id;
  }

  if (params.created) {
    operation.created = params.created;
  }

  try {
    operation = await operation.save();
  } catch (e) {
    ctx.log.error(e);
    ctx.status = 500;
    ctx.body = { error: e.message };
    return;
  }

  ctx.body = filterProps(operation);
});

router.post('/addTransfer', { jwt: true }, async (ctx) => {
  const params =
    pick(ctx.request.body, 'created', 'accountFrom', 'accountTo', 'amountFrom', 'amountTo');

  if (isUndefined(params.created)) {
    ctx.status = 400;
    ctx.body = { error: 'operation.addTransfer.error.created.required' };
    return;
  }

  if (isNaN(Date.parse(params.created))) {
    ctx.status = 400;
    ctx.body = { error: 'operation.addTransfer.error.created.invalid' };
    return;
  }

  if (isUndefined(params.accountFrom)) {
    ctx.status = 400;
    ctx.body = { error: 'operation.addTransfer.error.accountFrom.required' };
    return;
  }

  if (!mongoose.Types.ObjectId.isValid(params.accountFrom)) {
    ctx.status = 400;
    ctx.body = { error: 'operation.addTransfer.error.accountFrom.invalid' };
    return;
  }

  if (isUndefined(params.accountTo)) {
    ctx.status = 400;
    ctx.body = { error: 'operation.addTransfer.error.accountTo.required' };
    return;
  }

  if (!mongoose.Types.ObjectId.isValid(params.accountTo)) {
    ctx.status = 400;
    ctx.body = { error: 'operation.addTransfer.error.accountTo.invalid' };
    return;
  }

  if (params.accountFrom === params.accountTo) {
    ctx.status = 400;
    ctx.body = { error: 'operation.addTransfer.error.accountTo.equal' };
    return;
  }

  if (isUndefined(params.amountFrom)) {
    ctx.status = 400;
    ctx.body = { error: 'operation.addTransfer.error.amountFrom.required' };
    return;
  }

  if (isUndefined(params.amountTo)) {
    ctx.status = 400;
    ctx.body = { error: 'operation.addTransfer.error.amountTo.required' };
    return;
  }

  let accountFrom;
  let accountTo;

  try {
    const { accounts } = await UserModel.populate(ctx.user, {
      path: 'accounts',
      populate: { path: 'currency' },
    });

    accountFrom = accounts.find(account => account._id.equals(params.accountFrom));
    accountTo = accounts.find(account => account._id.equals(params.accountTo));

    if (!accountFrom) {
      ctx.status = 400;
      ctx.body = { error: 'operation.addTransfer.error.accountFrom.notFound' };
      return;
    }

    if (!accountTo) {
      ctx.status = 400;
      ctx.body = { error: 'operation.addTransfer.error.accountTo.notFound' };
      return;
    }
  } catch (e) {
    ctx.log.error(e);
    ctx.status = 500;
    ctx.body = { error: e.message };
    return;
  }

  let amountFrom;
  let amountTo;

  try {
    amountFrom = big(params.amountFrom);
  } catch (e) {
    ctx.status = 400;
    ctx.body = { error: 'operation.addTransfer.error.amountFrom.invalid' };
    return;
  }

  try {
    amountTo = big(params.amountTo);
  } catch (e) {
    ctx.status = 400;
    ctx.body = { error: 'operation.addTransfer.error.amountTo.invalid' };
    return;
  }

  if (amountFrom.lte(0)) {
    ctx.status = 400;
    ctx.body = { error: 'operation.addTransfer.error.amountFrom.positive' };
    return;
  }

  amountFrom = amountFrom.times(-1);

  if (amountTo.lte(0)) {
    ctx.status = 400;
    ctx.body = { error: 'operation.addTransfer.error.amountTo.positive' };
    return;
  }

  const operationFrom = new OperationModel();

  operationFrom.type = 'expense';
  operationFrom.amount = parseFloat(amountFrom.toFixed(accountFrom.currency.decimalDigits));
  operationFrom.user = ctx.user;
  operationFrom.created = params.created;
  operationFrom.account = accountFrom;

  const operationTo = new OperationModel();

  operationTo.type = 'income';
  operationTo.amount = parseFloat(amountTo.toFixed(accountTo.currency.decimalDigits));
  operationTo.user = ctx.user;
  operationTo.created = params.created;
  operationTo.account = accountTo;

  try {
    const { data: categoryData } = await CategoryModel.findOne({ user: ctx.user }, 'data');
    const tree = new TreeModel();
    const rootNode = tree.parse(categoryData);

    const categoryNode = rootNode.first(node => node.model.transfer === true);

    operationFrom.category = categoryNode.model._id;
    operationTo.category = categoryNode.model._id;
  } catch (e) {
    ctx.log.error(e);
    ctx.status = 500;
    ctx.body = { error: e.message };
    return;
  }

  const transfer = new TransferModel();

  operationFrom.transfer = transfer;
  operationTo.transfer = transfer;

  try {
    await operationFrom.save();
    await operationTo.save();

    transfer.operations.push(operationFrom, operationTo);

    await transfer.save();
  } catch (e) {
    ctx.log.error(e);
    ctx.status = 500;
    ctx.body = { error: e.message };
    return;
  }

  ctx.body = {
    operationFrom: filterProps(operationFrom),
    operationTo: filterProps(operationTo),
  };
});

router.post('/updateTransfer', { jwt: true }, async (ctx) => {
  const params =
    pick(ctx.request.body, '_id', 'created', 'accountFrom', 'accountTo', 'amountFrom', 'amountTo');

  if (isUndefined(params._id)) {
    ctx.status = 400;
    ctx.body = { error: 'operation.updateTransfer.error._id.required' };
    return;
  }

  if (!mongoose.Types.ObjectId.isValid(params._id)) {
    ctx.status = 400;
    ctx.body = { error: 'operation.updateTransfer.error._id.invalid' };
    return;
  }

  if (!isUndefined(params.created) && isNaN(Date.parse(params.created))) {
    ctx.status = 400;
    ctx.body = { error: 'operation.updateTransfer.error.created.invalid' };
    return;
  }

  if (!isUndefined(params.accountFrom) && !mongoose.Types.ObjectId.isValid(params.accountFrom)) {
    ctx.status = 400;
    ctx.body = { error: 'operation.updateTransfer.error.accountFrom.invalid' };
    return;
  }

  if (!isUndefined(params.accountTo) && !mongoose.Types.ObjectId.isValid(params.accountTo)) {
    ctx.status = 400;
    ctx.body = { error: 'operation.updateTransfer.error.accountTo.invalid' };
    return;
  }

  if ((!isUndefined(params.accountFrom) && !isUndefined(params.accountTo)) &&
    (params.accountFrom === params.accountTo)) {
    ctx.status = 400;
    ctx.body = { error: 'operation.updateTransfer.error.accountTo.equal' };
    return;
  }

  let accountFrom;
  let accountTo;

  if (params.accountFrom || params.accountTo) {
    try {
      const { accounts } = await UserModel.populate(ctx.user, {
        path: 'accounts',
        populate: { path: 'currency' },
      });

      if (!isUndefined(params.accountFrom)) {
        accountFrom = accounts.find(account => account._id.equals(params.accountFrom));

        if (!accountFrom) {
          ctx.status = 400;
          ctx.body = { error: 'operation.updateTransfer.error.accountFrom.notFound' };
          return;
        }
      }

      if (!isUndefined(params.accountTo)) {
        accountTo = accounts.find(account => account._id.equals(params.accountTo));

        if (!accountTo) {
          ctx.status = 400;
          ctx.body = { error: 'operation.updateTransfer.error.accountTo.notFound' };
          return;
        }
      }
    } catch (e) {
      ctx.log.error(e);
      ctx.status = 500;
      ctx.body = { error: e.message };
      return;
    }
  }

  let amountFrom;
  let amountTo;

  if (!isUndefined(params.amountFrom)) {
    try {
      amountFrom = big(params.amountFrom);
    } catch (e) {
      ctx.status = 400;
      ctx.body = { error: 'operation.updateTransfer.error.amountFrom.invalid' };
      return;
    }
  }

  if (!isUndefined(params.amountTo)) {
    try {
      amountTo = big(params.amountTo);
    } catch (e) {
      ctx.status = 400;
      ctx.body = { error: 'operation.updateTransfer.error.amountTo.invalid' };
      return;
    }
  }

  if (!isUndefined(params.amountFrom) && amountFrom.lte(0)) {
    ctx.status = 400;
    ctx.body = { error: 'operation.updateTransfer.error.amountFrom.positive' };
    return;
  }

  if (!isUndefined(params.amountFrom)) {
    amountFrom = amountFrom.times(-1);
  }

  if (!isUndefined(params.amountTo) && amountTo.lte(0)) {
    ctx.status = 400;
    ctx.body = { error: 'operation.updateTransfer.error.amountTo.positive' };
    return;
  }

  let operation;
  let operationFrom;
  let operationTo;

  try {
    operation = await OperationModel.findById(params._id).populate({
      path: 'account',
      populate: { path: 'currency' },
    });

    if (!operation) {
      ctx.status = 400;
      ctx.body = { error: 'operation.updateTransfer.error._id.notFound' };
      return;
    }
  } catch (e) {
    ctx.log.error(e);
    ctx.status = 500;
    ctx.body = { error: e.message };
    return;
  }

  if (operation.type === 'expense') {
    operationFrom = operation;
  } else {
    operationTo = operation;
  }

  try {
    const transfer = await TransferModel
      .findOne({ operations: { $in: [operation._id] } });

    if (!transfer) {
      ctx.status = 400;
      ctx.body = { error: 'operation.updateTransfer.error._id.notFound' };
      return;
    }

    const transferOperationId =
      transfer.operations.find(transferOperation => !transferOperation.equals(operation._id));

    operation = await OperationModel.findById(transferOperationId).populate({
      path: 'account',
      populate: { path: 'currency' },
    });

    if (!operation) {
      ctx.status = 400;
      ctx.body = { error: 'operation.updateTransfer.error._id.notFound' };
      return;
    }
  } catch (e) {
    ctx.log.error(e);
    ctx.status = 500;
    ctx.body = { error: e.message };
    return;
  }

  if (operation.type === 'expense') {
    operationFrom = operation;
  } else {
    operationTo = operation;
  }

  if (!isUndefined(params.amountFrom)) {
    operationFrom.amount = parseFloat(amountFrom.toFixed(accountFrom.currency.decimalDigits));
  }

  if (!isUndefined(params.created)) {
    operationFrom.created = params.created;
    operationTo.created = params.created;
  }

  if (!isUndefined(params.accountFrom)) {
    operationFrom.account = accountFrom;
  }

  if (!isUndefined(params.amountTo)) {
    operationTo.amount = parseFloat(amountTo.toFixed(accountTo.currency.decimalDigits));
  }

  if (!isUndefined(params.accountTo)) {
    operationTo.account = accountTo;
  }

  try {
    await operationFrom.save();
    await operationTo.save();
  } catch (e) {
    ctx.log.error(e);
    ctx.status = 500;
    ctx.body = { error: e.message };
    return;
  }

  ctx.body = {
    operationFrom: filterProps(operationFrom),
    operationTo: filterProps(operationTo),
  };
});

router.get('/list', { jwt: true }, async (ctx) => {
  const params = pick(ctx.request.query, 'account', 'type', 'category', 'amountFrom',
      'amountTo', 'dateFrom', 'dateTo', 'skip', 'limit');

  const query = { user: ctx.user };

  let transferCategoryId;
  let isTransferCategory = false;

  try {
    const { data: categoryData } = await CategoryModel.findOne({ user: ctx.user }, 'data');
    const tree = new TreeModel();
    const rootNode = tree.parse(categoryData);

    transferCategoryId = rootNode.first(node => node.model.transfer === true).model._id.toString();
  } catch (e) {
    ctx.log.error(e);
    ctx.status = 500;
    ctx.body = { error: e.message };
    return;
  }

  if (!isUndefined(params.account)) {
    if (!isArray(params.account)) {
      params.account = [params.account];
    }

    if (params.account.some(account => !mongoose.Types.ObjectId.isValid(account))) {
      ctx.status = 400;
      ctx.body = { error: 'operation.list.error.account.invalid' };
      return;
    }

    query.account = { $in: params.account };
  }

  if (!isUndefined(params.type)) {
    if (!['income', 'expense'].includes(params.type)) {
      ctx.status = 400;
      ctx.body = { error: 'operation.list.error.type.invalid' };
      return;
    }

    query.type = params.type;
  }

  if (!isUndefined(params.category)) {
    if (!isArray(params.category)) {
      params.category = [params.category];
    }

    isTransferCategory = params.category.includes(transferCategoryId);

    if (params.category.some(category => !mongoose.Types.ObjectId.isValid(category))) {
      ctx.status = 400;
      ctx.body = { error: 'operation.list.error.category.invalid' };
      return;
    }

    query.category = { $in: params.category };
  }

  let amountFrom;

  if (!isUndefined(params.amountFrom)) {
    try {
      amountFrom = big(params.amountFrom);
    } catch (e) {
      ctx.status = 400;
      ctx.body = { error: 'operation.list.error.amountFrom.invalid' };
      return;
    }

    if (amountFrom) {
      query.amount = { $gte: parseFloat(amountFrom.toFixed(2)) };
    }
  }

  let amountTo;

  if (!isUndefined(params.amountTo)) {
    try {
      amountTo = big(params.amountTo);
    } catch (e) {
      ctx.status = 400;
      ctx.body = { error: 'operation.list.error.amountTo.invalid' };
      return;
    }

    if (amountTo) {
      if (!query.amount) {
        query.amount = {};
      }

      query.amount.$lte = parseFloat(amountTo.toFixed(2));
    }
  }

  if (!isUndefined(params.dateFrom)) {
    if (isNaN(Date.parse(params.dateFrom))) {
      ctx.status = 400;
      ctx.body = { error: 'operation.list.error.dateFrom.invalid' };
      return;
    }

    query.created = { $gte: params.dateFrom };
  }

  if (!isUndefined(params.dateTo)) {
    if (isNaN(Date.parse(params.dateTo))) {
      ctx.status = 400;
      ctx.body = { error: 'operation.list.error.dateTo.invalid' };
      return;
    }

    if (!query.created) {
      query.created = {};
    }

    query.created.$lte = params.dateTo;
  }

  if (!isUndefined(params.skip)) {
    params.skip = parseInt(params.skip, 10);

    if (isNaN(params.skip)) {
      ctx.status = 400;
      ctx.body = { error: 'operation.list.error.skip.invalid' };
      return;
    }

    params.skip = params.skip < 0 ? 0 : params.skip;
  } else {
    params.skip = 0;
  }

  if (!isUndefined(params.limit)) {
    params.limit = parseInt(params.limit, 10);

    if (isNaN(params.limit)) {
      ctx.status = 400;
      ctx.body = { error: 'operation.list.error.limit.invalid' };
      return;
    }

    params.limit = params.limit <= 0 ? 1 : params.limit;
    params.limit = params.limit > 200 ? 200 : params.limit;
  } else {
    params.limit = 50;
  }

  let operations;
  let transfers;
  let total;
  let totalTransfers;

  try {
    operations = await OperationModel
      .find(query, publicFields.join(' '))
      .skip(params.skip)
      .limit(params.limit * 2)
      .sort({ created: 1 })
      .lean();

    if (!operations) {
      ctx.body = { operations: [], total: 0 };
      return;
    }

    total = await OperationModel.count(query);
    totalTransfers = await OperationModel.count(Object.assign(query, {
      transfer: { $exists: true },
    }));

    transfers = (await TransferModel
      .find({ operations: { $in: operations } })
      .populate('operations')) || [];

    transfers = transfers.map(transfer => transfer.operations.map(filterProps));

    if (isTransferCategory) {
      operations = [];
    }

    remove(operations, operation => transfers
      .some(transfer => transfer
        .some(transferOperation => operation._id.equals(transferOperation._id))));

    operations = operations.map(filterProps);

    if ((isUndefined(params.type) && isUndefined(params.category)) || isTransferCategory) {
      operations.push(...transfers);
    }

    operations = sortBy(operations, (operation) => {
      if (isArray(operation)) {
        return new Date(operation[0].created);
      }

      return new Date(operation.created);
    }).reverse();

    if (operations.length > params.limit) {
      operations.splice(0, operations.length - params.limit);
    }
  } catch (e) {
    ctx.log.error(e);
    ctx.status = 500;
    ctx.body = { error: e.message };
    return;
  }

  ctx.body = { operations, total: total - Math.floor(totalTransfers / 2) };
});

export default router;
