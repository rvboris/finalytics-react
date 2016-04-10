import Router from 'koa-66';
import { pick } from 'lodash';
import TreeModel from 'tree-model';
import mongoose from 'mongoose';

import categoryFixture from '../fixtures/category';
import { error } from '../../shared/log';
import { CategoryModel } from '../models';

const router = new Router();

router.get('/load', { jwt: true }, async (ctx) => {
  const categoryData = categoryFixture[ctx.user.settings.locale] || categoryFixture.ru;

  const tree = new TreeModel();
  const rootNode = tree.parse(categoryData);

  try {
    const categoryIsExists = (await CategoryModel.count({ user: ctx.user })) > 0;

    let category;

    if (ctx.user.status === 'init' || !categoryIsExists) {
      rootNode.walk((node) => {
        node.model._id = mongoose.Types.ObjectId();
      });

      category = new CategoryModel({ user: ctx.user, data: categoryData });

      await category.save();
    } else {
      category = await CategoryModel.findOne({ user: ctx.user }, '_id data');
    }

    ctx.body = pick(category, '_id', 'data');
  } catch (e) {
    error(e);
    ctx.status = 500;
    ctx.body = { error: e.message };
  }
});

router.post('/update', { jwt: true }, async (ctx) => {
  const params = pick(ctx.request.body, '_id', 'name');

  if (!params._id) {
    ctx.status = 400;
    ctx.body = { error: 'category.update.error._id.required' };
    return;
  }

  if (!params.name) {
    ctx.status = 400;
    ctx.body = { error: 'category.update.error.name.required' };
    return;
  }

  const categoryModel = await CategoryModel.findOne({ user: ctx.user }, '_id data');

  const tree = new TreeModel();
  const rootNode = tree.parse(categoryModel.data);

  const resultNode = rootNode.first((node) => node.model._id.toString() === params._id);

  if (!resultNode) {
    ctx.status = 400;
    ctx.body = { error: 'category.update.error._id.notFound' };
    return;
  }

  if (resultNode.model.system) {
    ctx.status = 400;
    ctx.body = { error: 'category.update.error.isSystem' };
    return;
  }

  if (params.name) {
    resultNode.model.name = params.name;
    categoryModel.markModified('data');
  }

  try {
    await categoryModel.save();
  } catch (e) {
    error(e);
    ctx.status = 500;
    ctx.body = { error: e.message };
  }

  ctx.body = categoryModel;
});

router.post('/add', { jwt: true }, async (ctx) => {
  const { _id, newNode } = ctx.request.body;

  if (!_id) {
    ctx.status = 400;
    ctx.body = { error: 'category.add.error._id.required' };
    return;
  }

  if (!newNode) {
    ctx.status = 400;
    ctx.body = { error: 'category.add.error.params.required' };
    return;
  }

  const { name, type } = newNode;

  if (!name) {
    ctx.status = 400;
    ctx.body = { error: 'category.add.error.name.required' };
    return;
  }

  if (!type) {
    ctx.status = 400;
    ctx.body = { error: 'category.add.error.type.required' };
    return;
  }

  if (['income', 'expense', 'any'].indexOf(type) < 0) {
    ctx.status = 400;
    ctx.body = { error: 'category.add.error.type.invalid' };
    return;
  }

  const categoryModel = await CategoryModel.findOne({ user: ctx.user }, '_id data');

  const tree = new TreeModel();
  const rootNode = tree.parse(categoryModel.data);

  const resultNode = rootNode.first((node) => node.model._id.toString() === _id);

  if (!resultNode) {
    ctx.status = 400;
    ctx.body = { error: 'category.add.error._id.notFound' };
    return;
  }

  if (resultNode.model.type !== 'any' && resultNode.model.type !== type) {
    ctx.status = 400;
    ctx.body = { error: 'category.add.error.type.parentInvalid' };
    return;
  }

  resultNode.addChild(tree.parse({ _id: mongoose.Types.ObjectId(), name, type }));

  categoryModel.markModified('data');

  try {
    await categoryModel.save();
  } catch (e) {
    error(e);
    ctx.status = 500;
    ctx.body = { error: e.message };
  }

  ctx.body = categoryModel;
});

router.post('/delete', { jwt: true }, async (ctx) => {
  const { _id } = ctx.request.body;

  if (!_id) {
    ctx.status = 400;
    ctx.body = { error: 'category.delete.error._id.required' };
    return;
  }

  const categoryModel = await CategoryModel.findOne({ user: ctx.user }, '_id data');

  const tree = new TreeModel();
  const rootNode = tree.parse(categoryModel.data);

  const resultNode = rootNode.first((node) => node.model._id.toString() === _id);

  if (!resultNode) {
    ctx.status = 400;
    ctx.body = { error: 'category.delete.error._id.notFound' };
    return;
  }

  if (resultNode.model.system) {
    ctx.status = 400;
    ctx.body = { error: 'category.delete.error.isSystem' };
    return;
  }

  resultNode.drop();

  categoryModel.markModified('data');

  try {
    await categoryModel.save();
  } catch (e) {
    error(e);
    ctx.status = 500;
    ctx.body = { error: e.message };
  }

  ctx.body = categoryModel;
});

router.post('/move', { jwt: true }, async (ctx) => {
  const { _id, to } = ctx.request.body;

  if (!_id) {
    ctx.status = 400;
    ctx.body = { error: 'category.move.error._id.required' };
    return;
  }

  if (!to) {
    ctx.status = 400;
    ctx.body = { error: 'category.move.error.to.required' };
    return;
  }

  const categoryModel = await CategoryModel.findOne({ user: ctx.user }, '_id data');

  const tree = new TreeModel();
  const rootNode = tree.parse(categoryModel.data);

  const resultNode = rootNode.first((node) => node.model._id.toString() === _id);

  if (!resultNode) {
    ctx.status = 400;
    ctx.body = { error: 'category.move.error._id.notFound' };
    return;
  }

  if (resultNode.model.system) {
    ctx.status = 400;
    ctx.body = { error: 'category.move.error.isSystem' };
    return;
  }

  const toNode = rootNode.first((node) => node.model._id.toString() === to);

  if (!toNode) {
    ctx.status = 400;
    ctx.body = { error: 'category.move.error.to.notFound' };
    return;
  }

  if (toNode.model.type !== 'any' && toNode.model.type !== resultNode.model.type) {
    ctx.status = 400;
    ctx.body = { error: 'category.move.error.type.parentInvalid' };
    return;
  }

  resultNode.drop();
  toNode.addChild(resultNode);

  categoryModel.markModified('data');

  try {
    await categoryModel.save();
  } catch (e) {
    error(e);
    ctx.status = 500;
    ctx.body = { error: e.message };
  }

  ctx.body = categoryModel;
});

export default router;
