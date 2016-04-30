import Router from 'koa-66';
import mongoose from 'mongoose';
import big from 'big.js';
import TreeModel from 'tree-model';
import { pick } from 'lodash';

import { OperationModel, CategoryModel } from '../models';

const router = new Router();

router.post('/add', { jwt: true }, async (ctx) => {
  const params = pick(ctx.request.body, 'created', 'account', 'category', 'amount');

  if (!params.created) {
    ctx.status = 400;
    ctx.body = { error: 'operation.add.error.created.required' };
    return;
  }

  if (isNaN(Date.parse(params.created))) {
    ctx.status = 400;
    ctx.body = { error: 'operation.add.error.created.invalid' };
    return;
  }

  if (!params.account) {
    ctx.status = 400;
    ctx.body = { error: 'operation.add.error.account.required' };
    return;
  }

  if (!mongoose.Types.ObjectId.isValid(params.account)) {
    ctx.status = 400;
    ctx.body = { error: 'operation.add.error.account.invalid' };
    return;
  }

  if (!params.category) {
    ctx.status = 400;
    ctx.body = { error: 'operation.add.error.category.required' };
    return;
  }

  if (!mongoose.Types.ObjectId.isValid(params.category)) {
    ctx.status = 400;
    ctx.body = { error: 'operation.add.error.category.invalid' };
    return;
  }

  if (!params.amount) {
    ctx.status = 400;
    ctx.body = { error: 'operation.add.error.amount.required' };
    return;
  }

  if (!ctx.user.accounts.find(account => account.toString() === params.account)) {
    ctx.status = 400;
    ctx.body = { error: 'operation.add.error.account.notFound' };
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

  if (!_id) {
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

export default router;
