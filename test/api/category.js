import agent from '../agent';
import test from 'ava';
import TreeModel from 'tree-model';
import mongoose from 'mongoose';
import { sample, difference } from 'lodash';

let request;

test.before(async () => {
  request = await agent();

  await request.post('/api/auth/register').send({
    email: 'test@test.ru',
    password: '12345678',
    repeatPassword: '12345678',
  });
});

test.serial('user load default categories', async (t) => {
  const res = await request.get('/api/category/load');

  t.is(res.status, 200);
  t.true(mongoose.Types.ObjectId.isValid(res.body._id));
  t.true(typeof res.body.data === 'object');

  const tree = new TreeModel();
  const categoryRoot = tree.parse(res.body.data);

  categoryRoot.walk((node) => {
    t.true(mongoose.Types.ObjectId.isValid(node.model._id));
  });
});

test.serial('user load categories', async (t) => {
  await request.post('/api/user/status').send({ status: 'ready' });

  const res = await request.get('/api/category/load');

  t.is(res.status, 200);
  t.true(mongoose.Types.ObjectId.isValid(res.body._id));

  const tree = new TreeModel();
  const categoryRoot = tree.parse(res.body.data);

  categoryRoot.walk((node) => {
    t.true(mongoose.Types.ObjectId.isValid(node.model._id));
  });
});

test.serial('user set category prop', async (t) => {
  let res = await request.get('/api/category/load');

  let tree = new TreeModel();
  let categoryRoot = tree.parse(res.body.data);

  const categoryList = categoryRoot.all();

  const systemCategoryList = categoryList.filter((category) => category.model.system);
  const userCategoryList = difference(categoryList, systemCategoryList);

  res = await request.post('/api/category/update').send({});

  t.is(res.status, 400);
  t.is(res.body.error, 'category.update.error.id.invalid');

  res = await request.post('/api/category/update').send({
    _id: sample(systemCategoryList).model._id,
    type: 'income',
  });

  t.is(res.status, 400);
  t.is(res.body.error, 'category.update.error.isSystem');

  res = await request.post('/api/category/update').send({
    _id: sample(systemCategoryList).model._id,
    name: 'test',
  });

  t.is(res.status, 400);
  t.is(res.body.error, 'category.update.error.isSystem');

  res = await request.post('/api/category/update').send({
    _id: sample(systemCategoryList).model._id,
    system: 'test',
  });

  t.is(res.status, 400);
  t.is(res.body.error, 'category.update.error.params.invalid');

  res = await request.post('/api/category/update').send({
    _id: sample(systemCategoryList).model._id,
    test: 'test',
  });

  t.is(res.status, 400);
  t.is(res.body.error, 'category.update.error.params.invalid');

  res = await request.post('/api/category/update').send({
    _id: sample(userCategoryList).model._id,
    system: 'test',
  });

  t.is(res.status, 400);
  t.is(res.body.error, 'category.update.error.params.invalid');

  res = await request.post('/api/category/update').send({
    _id: sample(userCategoryList).model._id,
    test: 'test',
  });

  t.is(res.status, 400);
  t.is(res.body.error, 'category.update.error.params.invalid');

  res = await request.post('/api/category/update').send({
    _id: 'wrong id',
    type: 'any',
  });

  t.is(res.status, 400);
  t.is(res.body.error, 'category.update.error.notFound');

  res = await request.post('/api/category/update').send({
    _id: sample(userCategoryList).model._id,
    type: 'wrong type',
  });

  t.is(res.status, 400);
  t.is(res.body.error, 'category.update.error.type.invalid');

  const categoryIdToCheck = sample(userCategoryList).model._id;

  res = await request.post('/api/category/update').send({
    _id: categoryIdToCheck,
    name: 'test',
  });

  t.is(res.status, 200);
  t.true(mongoose.Types.ObjectId.isValid(res.body._id));

  tree = new TreeModel();
  categoryRoot = tree.parse(res.body.data);

  categoryRoot.walk((node) => {
    t.true(mongoose.Types.ObjectId.isValid(node.model._id));
  });

  let checkNode = categoryRoot.first((node) => node.model._id.toString() === categoryIdToCheck);

  const nameToCheck = 'test';

  t.is(checkNode.model.name, nameToCheck);

  res = await request.get('/api/category/load');

  t.is(res.status, 200);
  t.true(mongoose.Types.ObjectId.isValid(res.body._id));

  tree = new TreeModel();
  categoryRoot = tree.parse(res.body.data);

  checkNode = categoryRoot.first((node) => node.model._id.toString() === categoryIdToCheck);

  t.is(checkNode.model.name, nameToCheck);
});
