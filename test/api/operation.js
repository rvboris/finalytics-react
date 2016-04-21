import agent from '../agent';
import test from 'ava';
import moment from 'moment';
import mongoose from 'mongoose';
import TreeModel from 'tree-model';
import { sample, filter } from 'lodash';

let request;

test.before(async () => {
  request = await agent();

  await request.post('/api/auth/register').send({
    email: 'test@operation.ru',
    password: '12345678',
    repeatPassword: '12345678',
  });
});

test.serial('add', async (t) => {
  let res = await request.get('/api/account/load');

  const accounts = res.body.accounts;

  res = await request.get('/api/category/load');

  const tree = new TreeModel();
  const categoryRoot = tree.parse(res.body.data);
  const categoryList = categoryRoot.all();
  const incomeCategoryList = filter(categoryList, category => category.model.type === 'income');
  const expenseCategoryList = filter(categoryList, category => category.model.type === 'expense');

  res = await request.post('/api/operation/add').send({});

  t.is(res.status, 400);
  t.is(res.body.error, 'operation.add.error.created.required');

  res = await request.post('/api/operation/add').send({
    created: 'wrong date',
  });

  t.is(res.status, 400);
  t.is(res.body.error, 'operation.add.error.created.invalid');

  res = await request.post('/api/operation/add').send({
    created: moment.utc(),
  });

  t.is(res.status, 400);
  t.is(res.body.error, 'operation.add.error.account.required');

  res = await request.post('/api/operation/add').send({
    created: moment.utc(),
    account: 'wrong account',
  });

  t.is(res.status, 400);
  t.is(res.body.error, 'operation.add.error.account.invalid');

  res = await request.post('/api/operation/add').send({
    created: moment.utc(),
    account: sample(accounts)._id,
  });

  t.is(res.status, 400);
  t.is(res.body.error, 'operation.add.error.category.required');

  res = await request.post('/api/operation/add').send({
    created: moment.utc(),
    account: sample(accounts)._id,
    category: 'wrong category',
  });

  t.is(res.status, 400);
  t.is(res.body.error, 'operation.add.error.category.invalid');

  res = await request.post('/api/operation/add').send({
    created: moment.utc(),
    account: sample(accounts)._id,
    category: sample(expenseCategoryList).model._id,
  });

  t.is(res.status, 400);
  t.is(res.body.error, 'operation.add.error.amount.required');

  res = await request.post('/api/operation/add').send({
    created: moment.utc(),
    account: mongoose.Types.ObjectId(),
    category: sample(expenseCategoryList).model._id,
    amount: -10,
  });

  t.is(res.status, 400);
  t.is(res.body.error, 'operation.add.error.account.notFound');

  res = await request.post('/api/operation/add').send({
    created: moment.utc(),
    account: sample(accounts)._id,
    category: sample(expenseCategoryList).model._id,
    amount: 'wrong amount',
  });

  t.is(res.status, 400);
  t.is(res.body.error, 'operation.add.error.amount.invalid');

  res = await request.post('/api/operation/add').send({
    created: moment.utc(),
    account: sample(accounts)._id,
    category: mongoose.Types.ObjectId(),
    amount: -10,
  });

  t.is(res.status, 400);
  t.is(res.body.error, 'operation.add.error.category.notFound');

  res = await request.post('/api/operation/add').send({
    created: moment.utc(),
    account: sample(accounts)._id,
    category: sample(incomeCategoryList).model._id,
    amount: 10,
  });

  t.is(res.status, 200);
  t.true(typeof res.body === 'object');
  t.is(res.body.type, 'income');

  res = await request.post('/api/operation/add').send({
    created: moment.utc(),
    account: sample(accounts)._id,
    category: sample(expenseCategoryList).model._id,
    amount: -10,
  });

  t.is(res.status, 200);
  t.true(typeof res.body === 'object');
  t.is(res.body.type, 'expense');
});
