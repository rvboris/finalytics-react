import agent from '../agent';
import test from 'ava';
import moment from 'moment';
import TreeModel from 'tree-model';
import { sample, filter } from 'lodash';

let request;

let accounts;
let categoryList;
let incomeCategoryList;
let expenseCategoryList;
let currencyList;

test.before(async () => {
  request = await agent();

  await request.post('/api/auth/register').send({
    email: 'test@balance.ru',
    password: '12345678',
    repeatPassword: '12345678',
  });

  let res = await request.get('/api/account/load');

  accounts = res.body.accounts;

  res = await request.get('/api/category/load');

  const tree = new TreeModel();
  const categoryRoot = tree.parse(res.body.data);

  categoryList = categoryRoot.all();
  incomeCategoryList = filter(categoryList, category => category.model.type === 'income');
  expenseCategoryList = filter(categoryList, category => category.model.type === 'expense');

  res = await request.get('/api/currency/load');
  currencyList = res.body.currencyList;
});

test.serial('add income operation', async (t) => {
  const accountToCheck = accounts[0];
  const amount = 100;

  let res = await request.post('/api/operation/add').send({
    created: moment.utc('2016-01-10'),
    account: accountToCheck._id,
    category: sample(incomeCategoryList).model._id,
    amount,
  });

  t.is(res.status, 200);
  t.is(res.body.balance, 100);

  res = await request.get('/api/account/load');

  t.is(res.status, 200);
  t.is(res.body.accounts[0].currentBalance, 100);
  t.is(res.body.accounts[0].startBalance, 0);
});

test.serial('add expense operation', async (t) => {
  const accountToCheck = accounts[0];
  const amount = -200;

  let res = await request.post('/api/operation/add').send({
    created: moment.utc('2016-01-20'),
    account: accountToCheck._id,
    category: sample(expenseCategoryList).model._id,
    amount,
  });

  t.is(res.status, 200);
  t.is(res.body.balance, -100);

  res = await request.get('/api/account/load');

  t.is(res.status, 200);
  t.is(res.body.accounts[0].currentBalance, -100);
  t.is(res.body.accounts[0].startBalance, 0);
});

test.serial('insert income operation at start', async (t) => {
  const accountToCheck = accounts[0];
  const amount = 500;

  let res = await request.post('/api/operation/add').send({
    created: moment.utc('2016-01-09'),
    account: accountToCheck._id,
    category: sample(incomeCategoryList).model._id,
    amount,
  });

  t.is(res.status, 200);
  t.is(res.body.balance, 400);

  res = await request.get('/api/account/load');

  t.is(res.status, 200);
  t.is(res.body.accounts[0].currentBalance, 400);
  t.is(res.body.accounts[0].startBalance, 0);

  res = await request.get('/api/operation/list');

  t.is(res.status, 200);
  t.is(res.body.total, 3);
  t.is(res.body.operations[0].balance, 400);
  t.is(res.body.operations[1].balance, 600);
  t.is(res.body.operations[2].balance, 500);
});

test.serial('update operation date', async (t) => {
  let res = await request.get('/api/operation/list');
  t.is(res.status, 200);

  const operationToUpdate = res.body.operations[2];

  res = await request.post('/api/operation/update').send({
    _id: operationToUpdate._id,
    created: moment.utc('2016-01-15'),
  });

  t.is(res.status, 200);

  res = await request.get('/api/operation/list');

  t.is(res.status, 200);
  t.is(res.body.operations[0].balance, 400);
  t.is(res.body.operations[1].balance, 600);
  t.is(res.body.operations[2].balance, 100);
});

test.serial('update operation amount', async (t) => {
  let res = await request.get('/api/operation/list');
  t.is(res.status, 200);

  const operationToUpdate = res.body.operations[1];
  const newAmount = 300;

  res = await request.post('/api/operation/update').send({
    _id: operationToUpdate._id,
    amount: newAmount,
  });

  t.is(res.status, 200);

  res = await request.get('/api/operation/list');

  t.is(res.status, 200);
  t.is(res.body.operations[0].balance, 200);
  t.is(res.body.operations[1].balance, 400);
  t.is(res.body.operations[2].balance, 100);
});

test.serial('update operation account', async (t) => {
  let res = await request.get('/api/operation/list');
  t.is(res.status, 200);

  const operationToUpdate = res.body.operations[1];
  const newAccountId = accounts[1]._id;

  res = await request.post('/api/operation/update').send({
    _id: operationToUpdate._id,
    account: newAccountId,
  });

  t.is(res.status, 200);

  res = await request.get('/api/operation/list');

  t.is(res.status, 200);
  t.is(res.body.operations[0].balance, -100);
  t.is(res.body.operations[1].balance, 300);
  t.is(res.body.operations[2].balance, 100);

  res = await request.get('/api/account/load');

  t.is(res.status, 200);
  t.is(res.body.accounts[0].currentBalance, -100);
  t.is(res.body.accounts[1].currentBalance, 300);
});

test.serial('remove operation at start', async (t) => {
  let res = await request.get('/api/operation/list');
  t.is(res.status, 200);

  const operationToDelete = res.body.operations[2];

  res = await request.post('/api/operation/delete').send({
    _id: operationToDelete._id,
  });

  t.is(res.status, 200);

  res = await request.get('/api/operation/list');

  t.is(res.status, 200);
  t.is(res.body.total, 2);
  t.is(res.body.operations[0].balance, -200);
  t.is(res.body.operations[1].balance, 300);

  res = await request.get('/api/account/load');

  t.is(res.status, 200);
  t.is(res.body.accounts[0].currentBalance, -200);
  t.is(res.body.accounts[1].currentBalance, 300);
});

test.serial('remove operation at end', async (t) => {
  let res = await request.get('/api/operation/list');
  t.is(res.status, 200);

  const operationToDelete = res.body.operations[1];

  res = await request.post('/api/operation/delete').send({
    _id: operationToDelete._id,
  });

  t.is(res.status, 200);

  res = await request.get('/api/operation/list');

  t.is(res.status, 200);
  t.is(res.body.total, 1);
  t.is(res.body.operations[0].balance, -200);

  res = await request.get('/api/account/load');

  t.is(res.status, 200);
  t.is(res.body.accounts[0].currentBalance, -200);
  t.is(res.body.accounts[1].currentBalance, 0);
});

test.serial('remove operation last operation', async (t) => {
  let res = await request.get('/api/operation/list');
  t.is(res.status, 200);

  const operationToDelete = res.body.operations[0];

  res = await request.post('/api/operation/delete').send({
    _id: operationToDelete._id,
  });

  t.is(res.status, 200);

  res = await request.get('/api/operation/list');

  t.is(res.status, 200);
  t.is(res.body.total, 0);

  res = await request.get('/api/account/load');

  t.is(res.status, 200);
  t.is(res.body.accounts[0].currentBalance, 0);
  t.is(res.body.accounts[1].currentBalance, 0);
});

test.serial('account with start balance', async (t) => {
  let res = await request.post('/api/account/add').send({
    name: 'start balance test',
    startBalance: 1000,
    type: 'standart',
    currency: sample(currencyList)._id,
  });

  t.is(res.status, 200);
  t.is(res.body.accounts.length, 3);
  t.is(res.body.accounts[2].startBalance, 1000);
  t.is(res.body.accounts[2].currentBalance, 1000);

  const accountToCheck = res.body.accounts[2];
  const amount = 100;

  res = await request.post('/api/operation/add').send({
    created: moment.utc('2016-02-01'),
    account: accountToCheck._id,
    category: sample(incomeCategoryList).model._id,
    amount,
  });

  t.is(res.status, 200);
  t.is(res.body.balance, 1100);

  res = await request.get('/api/account/load');

  t.is(res.status, 200);
  t.is(res.body.accounts[0].currentBalance, 0);
  t.is(res.body.accounts[1].currentBalance, 0);
  t.is(res.body.accounts[2].currentBalance, 1100);
});

test.serial('update account start balance', async (t) => {
  let res = await request.get('/api/account/load');

  t.is(res.status, 200);

  const accountToUpdate = res.body.accounts[2];
  const newStartBalance = 500;

  res = await request.post('/api/account/update').send({
    _id: accountToUpdate._id,
    startBalance: newStartBalance,
  });

  t.is(res.status, 200);
  t.is(res.body.accounts[2].startBalance, 500);
  t.is(res.body.accounts[2].currentBalance, 600);
});

// test.serial('remove account', async (t) => {

// });

// test.serial('add transfer operation', async (t) => {

// });

// test.serial('insert transfer operation amount', async (t) => {

// });

// test.serial('update transfer operation date', async (t) => {

// });

// test.serial('update transfer operation account', async (t) => {

// });

// test.serial('add transfer operation in different currency', async (t) => {

// });
