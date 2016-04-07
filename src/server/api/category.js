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
  const categoryRoot = tree.parse(categoryData);

  try {
    const categoryIsExists = (await CategoryModel.count({ user: ctx.user })) > 0;

    let category;

    if (ctx.user.status === 'init' || !categoryIsExists) {
      categoryRoot.walk((node) => {
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
  const params = pick(ctx.request.body, '_id', 'name', 'type');

  if (!params._id) {
    ctx.status = 400;
    ctx.body = { error: 'category.update.error.id.invalid' };
    return;
  }

  if (!params.name && !params.type) {
    ctx.status = 400;
    ctx.body = { error: 'category.update.error.params.invalid' };
    return;
  }

  if (params.type && ['income', 'expense', 'any'].indexOf(params.type) < 0) {
    ctx.status = 400;
    ctx.body = { error: 'category.update.error.type.invalid' };
    return;
  }

  const categoryModel = await CategoryModel.findOne({ user: ctx.user }, '_id data');

  const tree = new TreeModel();
  const categoryRoot = tree.parse(categoryModel.data);

  const findedCategory = categoryRoot.first((node) => node.model._id.toString() === params._id);

  if (!findedCategory) {
    ctx.status = 400;
    ctx.body = { error: 'category.update.error.notFound' };
    return;
  }

  if (findedCategory.model.system) {
    ctx.status = 400;
    ctx.body = { error: 'category.update.error.isSystem' };
    return;
  }

  if (params.name) {
    findedCategory.model.name = params.name;
    categoryModel.markModified('data');
  }

  if (params.type) {
    findedCategory.model.type = params.type;
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

export default router;
