import agent from '../agent';
import test from 'ava';
import moment from 'moment';
import mongoose from 'mongoose';
import TreeModel from 'tree-model';
import { sample, filter } from 'lodash';
import Chance from 'chance';

let request;
let chance;

test.before(async () => {
  chance = new Chance();
  request = await agent();

  await request.post('/api/auth/register').send({
    email: 'test@operation.ru',
    password: '12345678',
    repeatPassword: '12345678',
  });
});

test.serial('list', async (t) => {
  let res = await request.get('/api/account/load');

  let accounts = res.body.accounts;

  res = await request.get('/api/category/load');

  const tree = new TreeModel();
  const categoryRoot = tree.parse(res.body.data);
  const transferCategoryId = categoryRoot.first(node => node.model.transfer === true).model._id;
  const categoryList = categoryRoot.all();
  const incomeCategoryList = filter(categoryList, category => category.model.type === 'income');
  const expenseCategoryList = filter(categoryList, category => category.model.type === 'expense');

  for (let i = 50; i >= 1; i--) {
    const amount = chance.integer({ min: 1, max: 100 });

    res = await request.post('/api/operation/add').send({
      created: moment()
        .startOf('year')
        .add(chance.integer({ min: 1, max: 300 }), 'd')
        .utc(),
      account: sample(accounts)._id,
      category: sample(incomeCategoryList).model._id,
      amount,
    });

    t.is(res.status, 200);
  }

  for (let i = 50; i >= 1; i--) {
    res = await request.post('/api/operation/addTransfer').send({
      created: moment()
        .startOf('year')
        .add(chance.integer({ min: 1, max: 300 }), 'd')
        .utc(),
      accountFrom: accounts[0]._id,
      accountTo: accounts[1]._id,
      amountFrom: chance.integer({ min: 1, max: 100 }),
      amountTo: chance.integer({ min: 1, max: 100 }),
    });

    accounts = accounts.reverse();

    t.is(res.status, 200);
  }

  for (let i = 50; i >= 1; i--) {
    const amount = chance.integer({ min: -100, max: -1 });

    res = await request.post('/api/operation/add').send({
      created: moment()
        .startOf('year')
        .add(chance.integer({ min: 1, max: 300 }), 'd')
        .utc(),
      account: sample(accounts)._id,
      category: sample(expenseCategoryList).model._id,
      amount,
    });

    t.is(res.status, 200);
  }

  res = await request.get('/api/operation/list').query({ limit: 150 });

  t.is(res.status, 200);
  t.is(res.body.operations.length, 150);
  t.is(res.body.total, 150);

  let prevItem;

  t.true(res.body.operations.every((operation) => {
    if (prevItem) {
      return moment(operation.created).isSameOrBefore(moment(prevItem));
    }

    prevItem = operation.created;
    return true;
  }));

  const operations = res.body.operations;
  const notTransferOperations = filter(operations, (operation) => !operation.transfer);

  res = await request.get('/api/operation/list').query({ account: 'wrong account' });

  t.is(res.status, 400);
  t.is(res.body.error, 'operation.list.error.account.invalid');

  res = await request.get('/api/operation/list').query({ account: ['wrong account'] });

  t.is(res.status, 400);
  t.is(res.body.error, 'operation.list.error.account.invalid');

  res = await request.get('/api/operation/list').query({
    account: [
      'wrong account',
      'wrong account',
    ],
  });

  t.is(res.status, 400);
  t.is(res.body.error, 'operation.list.error.account.invalid');

  res = await request.get('/api/operation/list').query({
    account: [
      'wrong account',
      mongoose.Types.ObjectId(),
    ],
  });

  t.is(res.status, 400);
  t.is(res.body.error, 'operation.list.error.account.invalid');

  res = await request.get('/api/operation/list').query({ type: 'wrong type' });

  t.is(res.status, 400);
  t.is(res.body.error, 'operation.list.error.type.invalid');

  res = await request.get('/api/operation/list').query({ category: 'wrong category' });

  t.is(res.status, 400);
  t.is(res.body.error, 'operation.list.error.category.invalid');

  res = await request.get('/api/operation/list').query({ category: ['wrong category'] });

  t.is(res.status, 400);
  t.is(res.body.error, 'operation.list.error.category.invalid');

  res = await request.get('/api/operation/list').query({
    category: [
      'wrong category',
      'wrong category',
    ],
  });

  t.is(res.status, 400);
  t.is(res.body.error, 'operation.list.error.category.invalid');

  res = await request.get('/api/operation/list').query({
    category: [
      'wrong category',
      mongoose.Types.ObjectId(),
    ],
  });

  t.is(res.status, 400);
  t.is(res.body.error, 'operation.list.error.category.invalid');

  res = await request.get('/api/operation/list').query({ amountFrom: 'wrong amount' });

  t.is(res.status, 400);
  t.is(res.body.error, 'operation.list.error.amountFrom.invalid');

  res = await request.get('/api/operation/list').query({ amountTo: 'wrong amount' });

  t.is(res.status, 400);
  t.is(res.body.error, 'operation.list.error.amountTo.invalid');

  res = await request.get('/api/operation/list').query({ dateFrom: 'wrong date' });

  t.is(res.status, 400);
  t.is(res.body.error, 'operation.list.error.dateFrom.invalid');

  res = await request.get('/api/operation/list').query({ dateTo: 'wrong date' });

  t.is(res.status, 400);
  t.is(res.body.error, 'operation.list.error.dateTo.invalid');

  res = await request.get('/api/operation/list').query({ skip: 'wrong number' });

  t.is(res.status, 400);
  t.is(res.body.error, 'operation.list.error.skip.invalid');

  res = await request.get('/api/operation/list').query({ limit: 'wrong number' });

  t.is(res.status, 400);
  t.is(res.body.error, 'operation.list.error.limit.invalid');

  const accountToCheck = sample(accounts);

  res = await request.get('/api/operation/list').query({ account: accountToCheck._id });

  t.is(res.status, 200);
  t.true(res.body.operations.length > 0);
  t.true(res.body.operations.every((operation) => {
    if (operation.transfer) {
      return [operation.transfer.account, operation.account].includes(accountToCheck._id);
    }

    return operation.account === accountToCheck._id;
  }));

  res = await request.get('/api/operation/list').query({ type: 'expense' });

  t.is(res.status, 200);
  t.true(res.body.operations.length > 0);
  t.true(res.body.operations.every((operation) => {
    if (operation.transfer) {
      return false;
    }

    return operation.type === 'expense';
  }));

  let categoryToCheck = sample(notTransferOperations).category;

  res = await request.get('/api/operation/list').query({ category: categoryToCheck });

  t.is(res.status, 200);
  t.true(res.body.operations.length > 0);
  t.true(res.body.operations.every((operation) => {
    if (operation.transfer) {
      return false;
    }

    return operation.category === categoryToCheck;
  }));

  categoryToCheck = [
    sample(notTransferOperations).category,
    sample(notTransferOperations).category,
  ];

  res = await request.get('/api/operation/list').query({ category: [categoryToCheck] });

  t.is(res.status, 200);
  t.true(res.body.operations.length > 0);
  t.true(res.body.operations.every((operation) => {
    if (operation.transfer) {
      return false;
    }

    return categoryToCheck.includes(operation.category);
  }));

  res = await request.get('/api/operation/list').query({
    category: [transferCategoryId],
    limit: 150,
  });

  t.is(res.status, 200);
  t.is(res.body.operations.length, notTransferOperations.length - res.body.operations.length);
  t.true(res.body.operations.every((operation) => !!operation.transfer));

  res = await request.get('/api/operation/list').query({ amountFrom: 10, skip: 10 });

  t.is(res.status, 200);
  t.true(res.body.operations.length > 0);
  t.true(res.body.operations.every((operation) => {
    if (operation.transfer) {
      return operation.transfer.amount >= 10 || operation.amount >= 10;
    }

    return operation.amount >= 10;
  }));

  res = await request.get('/api/operation/list').query({ amountTo: 30, skip: 10 });

  t.is(res.status, 200);
  t.true(res.body.operations.length > 0);
  t.true(res.body.operations.every((operation) => {
    if (operation.transfer) {
      return operation.transfer.amount <= 30 || operation.amount <= 30;
    }

    return operation.amount <= 30;
  }));

  res = await request.get('/api/operation/list').query({
    amountFrom: -50,
    amountTo: 50,
  });

  t.is(res.status, 200);
  t.true(res.body.operations.length > 0);
  t.true(res.body.operations.every((operation) => {
    if (operation.transfer) {
      return operation.transfer.amount >= -50 && operation.transfer.amount <= 50 ||
        operation.amount >= -50 && operation.amount <= 50;
    }

    return operation.amount >= -50 && operation.amount <= 50;
  }));

  const checkDateFrom = moment.utc();

  res = await request.get('/api/operation/list').query({ dateFrom: checkDateFrom.toISOString() });

  t.is(res.status, 200);
  t.true(res.body.operations.length > 0);
  t.true(res.body.operations.every((operation) =>
    moment(operation.created).isSameOrAfter(checkDateFrom)));

  res = await request.get('/api/operation/list').query({ dateTo: checkDateFrom.toISOString() });

  t.is(res.status, 200);
  t.true(res.body.operations.length > 0);
  t.true(res.body.operations.every((operation) =>
    moment(operation.created).isSameOrBefore(checkDateFrom)));

  const checkDateTo = moment().add(30, 'd');

  res = await request.get('/api/operation/list').query({
    dateFrom: checkDateFrom.toISOString(),
    dateTo: checkDateTo.toISOString(),
  });

  t.is(res.status, 200);
  t.true(res.body.operations.length > 0);
  t.true(res.body.operations.every((operation) => moment(operation.created).isBefore(checkDateTo) &&
      moment(operation.created).isAfter(checkDateFrom)));

  res = await request.get('/api/operation/list').query({ limit: -1 });

  t.is(res.status, 200);
  t.is(res.body.total, 150);
  t.is(res.body.operations.length, 1);

  res = await request.get('/api/operation/list').query({ limit: 0 });

  t.is(res.status, 200);
  t.is(res.body.total, 150);
  t.is(res.body.operations.length, 1);

  res = await request.get('/api/operation/list').query({ skip: -1 });

  t.is(res.status, 200);
  t.is(res.body.total, 150);
  t.is(res.body.operations.length, 30);

  res = await request.get('/api/operation/list').query({ skip: 0 });

  t.is(res.status, 200);
  t.is(res.body.total, 150);
  t.is(res.body.operations.length, 30);

  res = await request.get('/api/operation/list').query({ skip: -1, limit: -1 });

  t.is(res.status, 200);
  t.is(res.body.total, 150);
  t.is(res.body.operations.length, 1);

  res = await request.get('/api/operation/list').query({ limit: 25 });

  t.is(res.status, 200);
  t.is(res.body.total, 150);
  t.is(res.body.operations.length, 25);

  res = await request.get('/api/operation/list').query({ limit: 25, skip: 50 });

  t.is(res.status, 200);
  t.is(res.body.total, 150);
  t.is(res.body.operations.length, 25);

  res = await request.get('/api/operation/list').query({ limit: 25, skip: 140 });

  t.is(res.status, 200);
  t.is(res.body.operations.length, 10);
  t.is(res.body.total, 150);

  res = await request.get('/api/operation/list').query({ limit: 1, skip: 149 });

  t.is(res.status, 200);
  t.is(res.body.operations.length, 1);
  t.is(res.body.total, 150);

  res = await request.get('/api/operation/list').query({ limit: 1, skip: 160 });

  t.is(res.status, 200);
  t.is(res.body.operations.length, 0);
  t.is(res.body.total, 150);

  res = await request.get('/api/operation/list').query({ limit: 25, skip: 50 });

  t.is(res.status, 200);
  t.is(res.body.operations.length, 25);

  res = await request.get('/api/operation/list');

  t.is(res.status, 200);
  t.is(res.body.operations.length, 30);
  t.is(res.body.total, 150);

  res = await request.get('/api/operation/list').query({ skip: 50, limit: 15 });

  t.is(res.status, 200);
  t.is(res.body.operations.length, 15);
  t.is(res.body.total, 150);
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

  let paramsToCheck = {
    created: moment.utc(),
    account: sample(accounts)._id,
    category: sample(incomeCategoryList).model._id,
    amount: 10,
  };

  res = await request.post('/api/operation/add').send(paramsToCheck);

  t.is(res.status, 200);
  t.is(res.body.type, 'income');
  t.is(res.body.category, paramsToCheck.category);
  t.is(res.body.account, paramsToCheck.account);
  t.is(moment(res.body.created).toISOString(), paramsToCheck.created.toISOString());

  paramsToCheck = {
    created: moment.utc(),
    account: sample(accounts)._id,
    category: sample(expenseCategoryList).model._id,
    amount: -10,
  };

  res = await request.post('/api/operation/add').send(paramsToCheck);

  t.is(res.status, 200);
  t.is(res.body.type, 'expense');
  t.is(res.body.category, paramsToCheck.category);
  t.is(res.body.account, paramsToCheck.account);
  t.is(moment(res.body.created).toISOString(), paramsToCheck.created.toISOString());
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

  const paramsToCheck = {
    created: moment.utc(),
    accountFrom: accounts[0]._id,
    accountTo: accounts[1]._id,
    amountFrom: 10,
    amountTo: 10,
  };

  res = await request.post('/api/operation/addTransfer').send(paramsToCheck);

  t.is(res.status, 200);

  t.is(moment(res.body.created).toISOString(), paramsToCheck.created.toISOString());
  t.is(res.body.account, paramsToCheck.accountFrom);
  t.is(res.body.amount, -paramsToCheck.amountFrom);
  t.is(res.body.type, 'transfer');
  t.is(res.body.transfer.amount, paramsToCheck.amountTo);
  t.is(res.body.transfer.account, paramsToCheck.accountTo);
});

test.serial('updateTransfer', async (t) => {
  let res = await request.get('/api/account/load');

  const accounts = res.body.accounts;

  const { body: transferToUpdate } = await request.post('/api/operation/addTransfer').send({
    created: moment.utc(),
    accountFrom: accounts[0]._id,
    accountTo: accounts[1]._id,
    amountFrom: 10,
    amountTo: 10,
  });

  res = await request.post('/api/operation/updateTransfer').send({});

  t.is(res.status, 400);
  t.is(res.body.error, 'operation.updateTransfer.error._id.required');

  res = await request.post('/api/operation/updateTransfer').send({
    _id: 'wrong id',
  });

  t.is(res.status, 400);
  t.is(res.body.error, 'operation.updateTransfer.error._id.invalid');

  res = await request.post('/api/operation/updateTransfer').send({
    _id: mongoose.Types.ObjectId(),
  });

  t.is(res.status, 400);
  t.is(res.body.error, 'operation.updateTransfer.error._id.notFound');

  res = await request.post('/api/operation/updateTransfer').send({
    _id: transferToUpdate._id,
  });

  t.is(res.status, 200);

  t.is(transferToUpdate.created, res.body.created);
  t.is(transferToUpdate.user, res.body.user);
  t.is(transferToUpdate.amount, res.body.amount);
  t.is(transferToUpdate.type, res.body.type);
  t.is(transferToUpdate.transfer.amount, res.body.transfer.amount);

  res = await request.post('/api/operation/updateTransfer').send({
    _id: transferToUpdate._id,
    created: 'wrong date',
  });

  t.is(res.status, 400);
  t.is(res.body.error, 'operation.updateTransfer.error.created.invalid');

  res = await request.post('/api/operation/updateTransfer').send({
    _id: transferToUpdate._id,
    accountFrom: 'wrong id',
  });

  t.is(res.status, 400);
  t.is(res.body.error, 'operation.updateTransfer.error.accountFrom.invalid');

  res = await request.post('/api/operation/updateTransfer').send({
    _id: transferToUpdate._id,
    accountTo: 'wrong id',
  });

  t.is(res.status, 400);
  t.is(res.body.error, 'operation.updateTransfer.error.accountTo.invalid');

  res = await request.post('/api/operation/updateTransfer').send({
    _id: transferToUpdate._id,
    accountFrom: accounts[0]._id,
    accountTo: accounts[0]._id,
  });

  t.is(res.status, 400);
  t.is(res.body.error, 'operation.updateTransfer.error.accountTo.equal');

  res = await request.post('/api/operation/updateTransfer').send({
    _id: transferToUpdate._id,
    accountFrom: mongoose.Types.ObjectId(),
  });

  t.is(res.status, 400);
  t.is(res.body.error, 'operation.updateTransfer.error.accountFrom.notFound');

  res = await request.post('/api/operation/updateTransfer').send({
    _id: transferToUpdate._id,
    accountTo: mongoose.Types.ObjectId(),
  });

  t.is(res.status, 400);
  t.is(res.body.error, 'operation.updateTransfer.error.accountTo.notFound');

  res = await request.post('/api/operation/updateTransfer').send({
    _id: transferToUpdate._id,
    amountFrom: 'wrong amount',
  });

  t.is(res.status, 400);
  t.is(res.body.error, 'operation.updateTransfer.error.amountFrom.invalid');

  res = await request.post('/api/operation/updateTransfer').send({
    _id: transferToUpdate._id,
    amountFrom: 0,
  });

  t.is(res.status, 400);
  t.is(res.body.error, 'operation.updateTransfer.error.amountFrom.positive');

  res = await request.post('/api/operation/updateTransfer').send({
    _id: transferToUpdate._id,
    amountTo: 'wrong amount',
  });

  t.is(res.status, 400);
  t.is(res.body.error, 'operation.updateTransfer.error.amountTo.invalid');

  res = await request.post('/api/operation/updateTransfer').send({
    _id: transferToUpdate._id,
    amountTo: 0,
  });

  t.is(res.status, 400);
  t.is(res.body.error, 'operation.updateTransfer.error.amountTo.positive');

  let paramsToCheck = {
    _id: transferToUpdate._id,
    created: moment.utc(),
    accountFrom: transferToUpdate.transfer.account,
    accountTo: transferToUpdate.account,
    amountFrom: 2,
    amountTo: 5,
  };

  res = await request.post('/api/operation/updateTransfer').send(paramsToCheck);

  t.is(res.status, 200);

  t.is(moment(res.body.created).toISOString(), paramsToCheck.created.toISOString());
  t.is(res.body.account, paramsToCheck.accountFrom);
  t.is(res.body.amount, -paramsToCheck.amountFrom);
  t.is(res.body.transfer.account, paramsToCheck.accountTo);
  t.is(res.body.transfer.amount, paramsToCheck.amountTo);
  t.is(res.body.type, 'transfer');

  paramsToCheck = {
    _id: transferToUpdate._id,
    created: moment.utc(),
    accountFrom: transferToUpdate.transfer.account,
    accountTo: transferToUpdate.account,
    amountFrom: 7,
    amountTo: 7,
  };

  res = await request.post('/api/operation/updateTransfer').send(paramsToCheck);

  t.is(res.status, 200);

  t.is(moment(res.body.created).toISOString(), paramsToCheck.created.toISOString());
  t.is(res.body.account, paramsToCheck.accountFrom);
  t.is(res.body.transfer.account, paramsToCheck.accountTo);
  t.is(res.body.transfer.amount, paramsToCheck.amountTo);
  t.is(res.body.amount, -paramsToCheck.amountFrom);
  t.is(res.body.type, 'transfer');
});
