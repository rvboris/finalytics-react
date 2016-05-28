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

test.serial('delete', async (t) => {
  let res = await request.post('/api/operation/delete').send({});

  t.is(res.status, 400);
  t.is(res.body.error, 'operation.delete.error._id.required');

  res = await request.post('/api/operation/delete').send({ _id: 'wrong' });

  t.is(res.status, 400);
  t.is(res.body.error, 'operation.delete.error._id.invalid');

  res = await request.post('/api/operation/delete').send({ _id: mongoose.Types.ObjectId() });

  t.is(res.status, 400);
  t.is(res.body.error, 'operation.delete.error._id.notFound');

  const { body: { accounts } } = await request.get('/api/account/load');

  res = await request.get('/api/category/load');

  const tree = new TreeModel();
  const categoryRoot = tree.parse(res.body.data);
  const categoryList = categoryRoot.all();
  const incomeCategoryList = filter(categoryList, category => category.model.type === 'income');

  res = await request.post('/api/operation/add').send({
    created: moment.utc(),
    account: sample(accounts)._id,
    category: sample(incomeCategoryList).model._id,
    amount: 10,
  });

  const operationToDelete = res.body;

  res = await request.post('/api/operation/delete').send({ _id: operationToDelete._id });

  t.is(res.status, 200);
});

test.serial('update', async (t) => {
  let res = await request.post('/api/operation/update').send({});

  t.is(res.status, 400);
  t.is(res.body.error, 'operation.update.error._id.required');

  res = await request.post('/api/operation/update').send({ _id: 'wrong' });

  t.is(res.status, 400);
  t.is(res.body.error, 'operation.update.error._id.invalid');

  res = await request.post('/api/operation/update').send({
    _id: mongoose.Types.ObjectId(),
    created: 'wrong date',
  });

  t.is(res.status, 400);
  t.is(res.body.error, 'operation.update.error.created.invalid');

  res = await request.post('/api/operation/update').send({
    _id: mongoose.Types.ObjectId(),
    account: 'wrong account id',
  });

  t.is(res.status, 400);
  t.is(res.body.error, 'operation.update.error.account.invalid');

  res = await request.post('/api/operation/update').send({
    _id: mongoose.Types.ObjectId(),
    category: 'wrong category id',
  });

  t.is(res.status, 400);
  t.is(res.body.error, 'operation.update.error.category.invalid');

  res = await request.post('/api/operation/update').send({
    _id: mongoose.Types.ObjectId(),
    amount: 'wrong amount',
  });

  t.is(res.status, 400);
  t.is(res.body.error, 'operation.update.error.amount.invalid');

  res = await request.post('/api/operation/update').send({
    _id: mongoose.Types.ObjectId(),
  });

  t.is(res.status, 400);
  t.is(res.body.error, 'operation.update.error._id.notFound');

  res = await request.get('/api/account/load');

  const accounts = res.body.accounts;

  res = await request.get('/api/category/load');

  const tree = new TreeModel();
  const categoryRoot = tree.parse(res.body.data);
  const categoryList = categoryRoot.all();
  const incomeCategoryList = filter(categoryList, category => category.model.type === 'income');
  const expenseCategoryList = filter(categoryList, category => category.model.type === 'expense');
  const anyCategoryList = filter(categoryList, category => category.model.type === 'any');

  res = await request.post('/api/operation/add').send({
    created: moment.utc(),
    account: sample(accounts)._id,
    category: sample(incomeCategoryList).model._id,
    amount: 10,
  });

  let operationToUpdate = res.body;

  res = await request.post('/api/operation/update').send({
    _id: operationToUpdate._id,
    account: mongoose.Types.ObjectId(),
  });

  t.is(res.status, 400);
  t.is(res.body.error, 'operation.update.error.account.notFound');

  res = await request.post('/api/operation/update').send({
    _id: operationToUpdate._id,
    amount: -10,
  });

  t.is(res.status, 400);
  t.is(res.body.error, 'operation.update.error.category.invalidType');

  res = await request.post('/api/operation/update').send({
    _id: operationToUpdate._id,
    category: mongoose.Types.ObjectId(),
  });

  t.is(res.status, 400);
  t.is(res.body.error, 'operation.update.error.category.notFound');

  res = await request.post('/api/operation/update').send({
    _id: operationToUpdate._id,
    category: sample(expenseCategoryList).model._id,
  });

  t.is(res.status, 400);
  t.is(res.body.error, 'operation.update.error.category.invalidType');

  res = await request.post('/api/operation/update').send({
    _id: operationToUpdate._id,
    amount: 100,
    category: sample(expenseCategoryList).model._id,
  });

  t.is(res.status, 400);
  t.is(res.body.error, 'operation.update.error.category.invalidType');

  res = await request.post('/api/operation/update').send({
    _id: operationToUpdate._id,
    amount: -10,
    category: sample(incomeCategoryList).model._id,
  });

  t.is(res.status, 400);
  t.is(res.body.error, 'operation.update.error.category.invalidType');

  const anyCategoryToCheck = sample(anyCategoryList).model;

  res = await request.post('/api/operation/update').send({
    _id: operationToUpdate._id,
    amount: -10,
    category: anyCategoryToCheck._id,
  });

  t.is(res.status, 200);
  t.is(res.body.amount, -10);
  t.is(res.body.category, anyCategoryToCheck._id);

  res = await request.post('/api/operation/add').send({
    created: moment.utc(),
    account: sample(accounts)._id,
    category: sample(anyCategoryList).model._id,
    amount: 10,
  });

  operationToUpdate = res.body;

  res = await request.post('/api/operation/update').send({
    _id: operationToUpdate._id,
    amount: -10,
  });

  t.is(res.status, 200);
  t.is(res.body.amount, -10);

  res = await request.post('/api/operation/update').send({
    _id: operationToUpdate._id,
    amount: -10,
    category: sample(anyCategoryList).model._id,
  });

  t.is(res.status, 200);
  t.is(res.body.amount, -10);

  res = await request.post('/api/operation/update').send({
    _id: operationToUpdate._id,
    amount: -10,
    category: sample(incomeCategoryList).model._id,
  });

  t.is(res.status, 400);
  t.is(res.body.error, 'operation.update.error.category.invalidType');

  res = await request.post('/api/operation/update').send({
    _id: operationToUpdate._id,
    amount: 100,
    category: sample(expenseCategoryList).model._id,
  });

  t.is(res.status, 400);
  t.is(res.body.error, 'operation.update.error.category.invalidType');

  res = await request.post('/api/operation/update').send({
    _id: operationToUpdate._id,
    amount: -100,
    category: sample(expenseCategoryList).model._id,
  });

  t.is(res.status, 200);
  t.is(res.body.amount, -100);

  res = await request.post('/api/operation/update').send({
    _id: operationToUpdate._id,
    category: sample(incomeCategoryList).model._id,
  });

  t.is(res.status, 400);
  t.is(res.body.error, 'operation.update.error.category.invalidType');

  const paramsToCheck = {
    _id: operationToUpdate._id,
    category: sample(incomeCategoryList).model._id,
    amount: 1000,
    created: moment.utc(),
    account: sample(accounts)._id,
  };

  res = await request.post('/api/operation/update').send(paramsToCheck);

  t.is(res.status, 200);
  t.is(res.body.category, paramsToCheck.category);
  t.is(res.body.amount, paramsToCheck.amount);
  t.is(moment(res.body.created).toISOString(), paramsToCheck.created.toISOString());
  t.is(res.body.account, paramsToCheck.account);
});

test.serial('addTransfer', async (t) => {
  let res = await request.post('/api/operation/addTransfer').send({});

  t.is(res.status, 400);
  t.is(res.body.error, 'operation.addTransfer.error.created.required');

  res = await request.post('/api/operation/addTransfer').send({
    created: 'wrong date',
  });

  t.is(res.status, 400);
  t.is(res.body.error, 'operation.addTransfer.error.created.invalid');

  res = await request.post('/api/operation/addTransfer').send({
    created: moment.utc(),
  });

  t.is(res.status, 400);
  t.is(res.body.error, 'operation.addTransfer.error.accountFrom.required');

  res = await request.post('/api/operation/addTransfer').send({
    created: moment.utc(),
    accountFrom: 'wrong account',
  });

  t.is(res.status, 400);
  t.is(res.body.error, 'operation.addTransfer.error.accountFrom.invalid');

  res = await request.post('/api/operation/addTransfer').send({
    created: moment.utc(),
    accountFrom: mongoose.Types.ObjectId(),
  });

  t.is(res.status, 400);
  t.is(res.body.error, 'operation.addTransfer.error.accountTo.required');

  res = await request.post('/api/operation/addTransfer').send({
    created: moment.utc(),
    accountFrom: mongoose.Types.ObjectId(),
    accountTo: 'wrong account',
  });

  t.is(res.status, 400);
  t.is(res.body.error, 'operation.addTransfer.error.accountTo.invalid');

  const accountEqual = mongoose.Types.ObjectId();

  res = await request.post('/api/operation/addTransfer').send({
    created: moment.utc(),
    accountFrom: accountEqual,
    accountTo: accountEqual,
  });

  t.is(res.status, 400);
  t.is(res.body.error, 'operation.addTransfer.error.accountTo.equal');

  res = await request.post('/api/operation/addTransfer').send({
    created: moment.utc(),
    accountFrom: mongoose.Types.ObjectId(),
    accountTo: mongoose.Types.ObjectId(),
  });

  t.is(res.status, 400);
  t.is(res.body.error, 'operation.addTransfer.error.amountFrom.required');

  res = await request.post('/api/operation/addTransfer').send({
    created: moment.utc(),
    accountFrom: mongoose.Types.ObjectId(),
    accountTo: mongoose.Types.ObjectId(),
    amountFrom: 10,
  });

  t.is(res.status, 400);
  t.is(res.body.error, 'operation.addTransfer.error.amountTo.required');

  res = await request.post('/api/operation/addTransfer').send({
    created: moment.utc(),
    accountFrom: mongoose.Types.ObjectId(),
    accountTo: mongoose.Types.ObjectId(),
    amountFrom: 10,
    amountTo: 10,
  });

  t.is(res.status, 400);
  t.is(res.body.error, 'operation.addTransfer.error.accountFrom.notFound');

  res = await request.get('/api/account/load');

  const accounts = res.body.accounts;

  res = await request.post('/api/operation/addTransfer').send({
    created: moment.utc(),
    accountFrom: sample(accounts)._id,
    accountTo: mongoose.Types.ObjectId(),
    amountFrom: 10,
    amountTo: 10,
  });

  t.is(res.status, 400);
  t.is(res.body.error, 'operation.addTransfer.error.accountTo.notFound');

  res = await request.post('/api/operation/addTransfer').send({
    created: moment.utc(),
    accountFrom: accounts[0]._id,
    accountTo: accounts[1]._id,
    amountFrom: 'wrong amount',
    amountTo: 'wrong amount',
  });

  t.is(res.status, 400);
  t.is(res.body.error, 'operation.addTransfer.error.amountFrom.invalid');

  res = await request.post('/api/operation/addTransfer').send({
    created: moment.utc(),
    accountFrom: accounts[0]._id,
    accountTo: accounts[1]._id,
    amountFrom: 10,
    amountTo: 'wrong amount',
  });

  t.is(res.status, 400);
  t.is(res.body.error, 'operation.addTransfer.error.amountTo.invalid');

  res = await request.post('/api/operation/addTransfer').send({
    created: moment.utc(),
    accountFrom: accounts[0]._id,
    accountTo: accounts[1]._id,
    amountFrom: 0,
    amountTo: 10,
  });

  t.is(res.status, 400);
  t.is(res.body.error, 'operation.addTransfer.error.amountFrom.positive');

  res = await request.post('/api/operation/addTransfer').send({
    created: moment.utc(),
    accountFrom: accounts[0]._id,
    accountTo: accounts[1]._id,
    amountFrom: 10,
    amountTo: 0,
  });

  t.is(res.status, 400);
  t.is(res.body.error, 'operation.addTransfer.error.amountTo.positive');

  res = await request.post('/api/operation/addTransfer').send({
    created: moment.utc(),
    accountFrom: accounts[0]._id,
    accountTo: accounts[1]._id,
    amountFrom: 10,
    amountTo: 10,
  });

  t.is(res.status, 200);
});
