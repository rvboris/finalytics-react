import Router from 'koa-66';
import mongoose from 'mongoose';
import big from 'big.js';
import TreeModel from 'tree-model';
import { get, pick, isUndefined, isArray, isBoolean, groupBy } from 'lodash';

import { OperationModel, UserModel, CategoryModel } from '../models';

const router = new Router();

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
      .first(node => node.model._id.toString() === params.category);

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

  ctx.body = operation.toObject({ versionKey: false, depopulate: true });
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
      node.model._id.toString() === operation.category.toString()).model;
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
    const categoryNode = rootNode.first((node) => node.model._id.toString() === params.category);

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

  ctx.body = operation.toObject({ versionKey: false, depopulate: true });
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

    accountFrom = accounts.find(account => account._id.toString() === params.accountFrom);
    accountTo = accounts.find(account => account._id.toString() === params.accountTo);

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

  try {
    await operationFrom.save();
    operationTo.groupTo = operationFrom;
    await operationTo.save();
    operationFrom.groupTo = operationTo;
    await operationFrom.save();
  } catch (e) {
    ctx.log.error(e);
    ctx.status = 500;
    ctx.body = { error: e.message };
    return;
  }

  ctx.body = {
    operationFrom: operationFrom.toObject({ versionKey: false, depopulate: true }),
    operationTo: operationTo.toObject({ versionKey: false, depopulate: true }),
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
        accountFrom = accounts.find(account => account._id.toString() === params.accountFrom);

        if (!accountFrom) {
          ctx.status = 400;
          ctx.body = { error: 'operation.updateTransfer.error.accountFrom.notFound' };
          return;
        }
      }

      if (!isUndefined(params.accountTo)) {
        accountTo = accounts.find(account => account._id.toString() === params.accountTo);

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
    operation = await OperationModel.findById(operation.groupTo).populate({
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
    operationFrom: operationFrom.toObject({ versionKey: false, depopulate: true }),
    operationTo: operationTo.toObject({ versionKey: false, depopulate: true }),
  };
});

router.get('/list', { jwt: true }, async (ctx) => {
  const params = pick(ctx.request.body, 'account', 'type', 'category', 'amountFrom',
      'amountTo', 'dateFrom', 'dateTo', 'transfer', 'paginate');

  const query = { user: ctx.user };

  if (isArray(params.account)) {
    if (params.account.find(account => !mongoose.Types.ObjectId.isValid(account))) {
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

  if (isArray(params.account)) {
    if (params.category.find(category => !mongoose.Types.ObjectId.isValid(category))) {
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

  if (!isUndefined(params.transfer)) {
    if (!isBoolean(params.transfer)) {
      ctx.status = 400;
      ctx.body = { error: 'operation.list.error.transfer.invalid' };
      return;
    }

    query.groupTo = { $exists: true };
  }

  let operations;

  const skip = parseInt(get(params, 'paginate.skip', 0), 10) || 0;
  let limit = parseInt(get(params, 'paginate.limit', 30), 10) || 30;

  limit = limit > 50 ? 50 : limit;

  const fields = ['_id', 'type', 'created', 'account', 'category', 'amount', 'groupTo'];

  try {
    operations = await OperationModel
      .find(query, fields.join(' '))
      .sort({ created: -1 })
      .skip(skip)
      .limit(limit)
      .lean();
  } catch (e) {
    ctx.log.error(e);
    ctx.status = 500;
    ctx.body = { error: e.message };
    return;
  }

  operations = groupBy(operations, (operation) => operation._id === operation.groupTo);

  ctx.body = operations;
});

export default router;
