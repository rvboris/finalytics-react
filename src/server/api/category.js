import Router from 'koa-66';
import { pick } from 'lodash';
import TreeModel from 'tree-model';
import mongoose from 'mongoose';

import categoryFixture from '../fixtures/category';
import { error } from '../../shared/log';
import { CategoryModel } from '../models';

const router = new Router();

router.post('/load', { jwt: true }, async (ctx) => {
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

export default router;
