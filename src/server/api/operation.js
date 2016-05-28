import Router from 'koa-66';
import mongoose from 'mongoose';
import big from 'big.js';
import TreeModel from 'tree-model';
import { pick, isUndefined } from 'lodash';

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
  }

  try {
    await operation.save();
  } catch (e) {
    ctx.log.error(e);
    ctx.status = 500;
    ctx.body = { error: e.message };
    return;
  }

  ctx.body = operation.toObject({ versionKey: false });
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
  }

  ctx.body = operation.toObject({ versionKey: false });
  ctx.body.account = ctx.body.account._id;
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
  operationTo.amount = parseFloat(amountFrom.toFixed(accountFrom.currency.decimalDigits));
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
    operationFrom: operationFrom.toObject({ versionKey: false }),
    operationTo: operationTo.toObject({ versionKey: false }),
  };
});

export default router;
