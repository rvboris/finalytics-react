import test from 'ava';
import TreeModel from 'tree-model';
import mongoose from 'mongoose';
import { sample, difference } from 'lodash';
import Chance from 'chance';

import agent from '../agent';

let request;
let chance;

test.before(async () => {
  chance = new Chance();
  request = await agent();

  await request.post('/api/auth/register').send({
    email: 'test@category.ru',
    password: '12345678',
    repeatPassword: '12345678',
  });
});

test.serial('load default', async (t) => {
  let res = await request.get('/api/category/load');

  t.is(res.status, 200);
  t.true(mongoose.Types.ObjectId.isValid(res.body._id));
  t.true(typeof res.body.data === 'object');

  const tree = new TreeModel();
  const categoryRoot = tree.parse(res.body.data);

  categoryRoot.walk((node) => {
    t.true(mongoose.Types.ObjectId.isValid(node.model._id));
  });

  const category = res.body;

  res = await request.get('/api/category/load');

  t.deepEqual(category, res.body);
});

test.serial('load', async (t) => {
  await request.post('/api/user/status').send({ status: 'ready' });

  let res = await request.get('/api/category/load');

  t.is(res.status, 200);
  t.true(mongoose.Types.ObjectId.isValid(res.body._id));

  const tree = new TreeModel();
  const categoryRoot = tree.parse(res.body.data);

  categoryRoot.walk((node) => {
    t.true(mongoose.Types.ObjectId.isValid(node.model._id));
  });

  const category = res.body;

  res = await request.get('/api/category/load');

  t.deepEqual(category, res.body);
});

test.serial('update', async (t) => {
  let res = await request.get('/api/category/load');

  let tree = new TreeModel();
  let categoryRoot = tree.parse(res.body.data);

  const categoryList = categoryRoot.all();

  const systemCategoryList = categoryList.filter((category) => category.model.system);
  const userCategoryList = difference(categoryList, systemCategoryList);

  res = await request.post('/api/category/update').send({});

  t.is(res.status, 400);
  t.is(res.body.error, 'category.update.error._id.required');

  res = await request.post('/api/category/update').send({
    _id: sample(systemCategoryList).model._id,
    name: chance.string({ length: 8 }),
  });

  t.is(res.status, 400);
  t.is(res.body.error, 'category.update.error.isSystem');

  res = await request.post('/api/category/update').send({
    _id: sample(systemCategoryList).model._id,
    test: chance.string({ length: 8 }),
  });

  t.is(res.status, 400);
  t.is(res.body.error, 'category.update.error.name.required');

  res = await request.post('/api/category/update').send({
    _id: 'wrong id',
    name: chance.string({ length: 8 }),
  });

  t.is(res.status, 400);
  t.is(res.body.error, 'category.update.error._id.notFound');

  const categoryIdToCheck = sample(userCategoryList).model._id;
  const nameToCheck = chance.string({ length: 8 });

  res = await request.post('/api/category/update').send({
    _id: categoryIdToCheck,
    name: nameToCheck,
  });

  t.is(res.status, 200);
  t.true(mongoose.Types.ObjectId.isValid(res.body._id));

  tree = new TreeModel();
  categoryRoot = tree.parse(res.body.data);

  categoryRoot.walk((node) => {
    t.true(mongoose.Types.ObjectId.isValid(node.model._id));
  });

  let checkNode = categoryRoot.first((node) => node.model._id.toString() === categoryIdToCheck);

  t.is(checkNode.model.name, nameToCheck);

  res = await request.get('/api/category/load');

  t.is(res.status, 200);
  t.true(mongoose.Types.ObjectId.isValid(res.body._id));

  tree = new TreeModel();
  categoryRoot = tree.parse(res.body.data);

  checkNode = categoryRoot.first((node) => node.model._id.toString() === categoryIdToCheck);

  t.is(checkNode.model.name, nameToCheck);
});

test.serial('add', async (t) => {
  let res = await request.get('/api/category/load');

  let tree = new TreeModel();
  let categoryRoot = tree.parse(res.body.data);

  const categoryList = categoryRoot.all();

  res = await request.post('/api/category/add').send({});

  t.is(res.status, 400);
  t.is(res.body.error, 'category.add.error._id.required');

  res = await request.post('/api/category/add').send({
    _id: sample(categoryList).model._id,
  });

  t.is(res.status, 400);
  t.is(res.body.error, 'category.add.error.params.required');

  res = await request.post('/api/category/add').send({
    _id: sample(categoryList).model._id,
    newNode: {},
  });

  t.is(res.status, 400);
  t.is(res.body.error, 'category.add.error.name.required');

  res = await request.post('/api/category/add').send({
    _id: sample(categoryList).model._id,
    newNode: {
      name: chance.string({ length: 8 }),
    },
  });

  t.is(res.status, 400);
  t.is(res.body.error, 'category.add.error.type.required');

  res = await request.post('/api/category/add').send({
    _id: sample(categoryList).model._id,
    newNode: {
      name: chance.string({ length: 8 }),
      type: 'wrong type',
    },
  });

  t.is(res.status, 400);
  t.is(res.body.error, 'category.add.error.type.invalid');

  res = await request.post('/api/category/add').send({
    _id: sample(categoryList.filter(node => node.model.type === 'income')).model._id,
    newNode: {
      name: chance.string({ length: 8 }),
      type: 'expense',
    },
  });

  t.is(res.status, 400);
  t.is(res.body.error, 'category.add.error.type.parentInvalid');

  res = await request.post('/api/category/add').send({
    _id: sample(categoryList.filter(node => node.model.type === 'expense')).model._id,
    newNode: {
      name: chance.string({ length: 8 }),
      type: 'income',
    },
  });

  t.is(res.status, 400);
  t.is(res.body.error, 'category.add.error.type.parentInvalid');

  res = await request.post('/api/category/add').send({
    _id: 'wrong id',
    newNode: {
      name: chance.string({ length: 8 }),
      type: 'income',
    },
  });

  t.is(res.status, 400);
  t.is(res.body.error, 'category.add.error._id.notFound');

  const nameToCheck = chance.string({ length: 8 });
  const parentToCheck = sample(categoryList).model;

  res = await request.post('/api/category/add').send({
    _id: parentToCheck._id,
    newNode: {
      name: nameToCheck,
      type: parentToCheck.type,
    },
  });

  t.is(res.status, 200);
  t.true(mongoose.Types.ObjectId.isValid(res.body._id));
  t.true(mongoose.Types.ObjectId.isValid(res.body.newId));

  tree = new TreeModel();
  categoryRoot = tree.parse(res.body.data);

  const checkNode = categoryRoot.first((node) => node.model.name.toString() === nameToCheck);

  t.is(checkNode.model.name, nameToCheck);
  t.is(checkNode.model.type, parentToCheck.type);
  t.is(checkNode.parent.model._id, parentToCheck._id);
});

test.serial('delete', async (t) => {
  let res = await request.get('/api/category/load');

  let tree = new TreeModel();
  let categoryRoot = tree.parse(res.body.data);

  const categoryList = categoryRoot.all();

  const systemCategoryList = categoryList.filter((category) => category.model.system);
  const userCategoryList = difference(categoryList, systemCategoryList);

  res = await request.post('/api/category/delete').send({});

  t.is(res.status, 400);
  t.is(res.body.error, 'category.delete.error._id.required');

  res = await request.post('/api/category/delete').send({
    _id: 'wrong id',
  });

  t.is(res.status, 400);
  t.is(res.body.error, 'category.delete.error._id.notFound');

  res = await request.post('/api/category/delete').send({
    _id: sample(systemCategoryList).model._id,
  });

  t.is(res.status, 400);
  t.is(res.body.error, 'category.delete.error.isSystem');

  const nodeIdToCheck = sample(userCategoryList).model._id;

  res = await request.post('/api/category/delete').send({
    _id: nodeIdToCheck,
  });

  t.is(res.status, 200);
  t.true(mongoose.Types.ObjectId.isValid(res.body._id));

  tree = new TreeModel();
  categoryRoot = tree.parse(res.body.data);

  const checkNode = categoryRoot.first((node) => node.model._id === nodeIdToCheck);

  t.true(typeof checkNode === 'undefined');
});

test.serial('move', async (t) => {
  let res = await request.get('/api/category/load');

  let tree = new TreeModel();
  let categoryRoot = tree.parse(res.body.data);

  const categoryList = categoryRoot.all();

  const systemCategoryList = categoryList.filter((category) => category.model.system);
  const userCategoryList = difference(categoryList, systemCategoryList);

  res = await request.post('/api/category/move').send({});

  t.is(res.status, 400);
  t.is(res.body.error, 'category.move.error._id.required');

  res = await request.post('/api/category/move').send({
    _id: 'wrong id',
  });

  t.is(res.status, 400);
  t.is(res.body.error, 'category.move.error.to.required');

  res = await request.post('/api/category/move').send({
    _id: 'wrong id',
    to: 'wrong id',
  });

  t.is(res.status, 400);
  t.is(res.body.error, 'category.move.error._id.notFound');

  res = await request.post('/api/category/move').send({
    _id: sample(systemCategoryList).model._id,
    to: 'wrong id',
  });

  t.is(res.status, 400);
  t.is(res.body.error, 'category.move.error.isSystem');

  res = await request.post('/api/category/move').send({
    _id: sample(userCategoryList).model._id,
    to: 'wrong id',
  });

  t.is(res.status, 400);
  t.is(res.body.error, 'category.move.error.to.notFound');

  res = await request.post('/api/category/move').send({
    _id: sample(userCategoryList.filter((node) => node.model.type === 'income')).model._id,
    to: sample(userCategoryList.filter((node) => node.model.type === 'expense')).model._id,
  });

  t.is(res.status, 400);
  t.is(res.body.error, 'category.move.error.type.parentInvalid');

  res = await request.post('/api/category/move').send({
    _id: sample(userCategoryList.filter((node) => node.model.type === 'expense')).model._id,
    to: sample(userCategoryList.filter((node) => node.model.type === 'income')).model._id,
  });

  t.is(res.status, 400);
  t.is(res.body.error, 'category.move.error.type.parentInvalid');

  const fromNode = sample(userCategoryList.filter((node) => node.model.type === 'expense'));
  const toNode = sample(systemCategoryList.filter((node) => node.model.type === 'any'));

  res = await request.post('/api/category/move').send({
    _id: fromNode.model._id,
    to: toNode.model._id,
  });

  t.is(res.status, 200);
  t.true(mongoose.Types.ObjectId.isValid(res.body._id));

  tree = new TreeModel();
  categoryRoot = tree.parse(res.body.data);

  const checkNode = categoryRoot.first((node) => node.model._id === fromNode.model._id);

  t.is(checkNode.parent.model._id, toNode.model._id);
});
