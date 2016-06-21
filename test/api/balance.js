import agent from '../agent';
import test from 'ava';
import moment from 'moment';
import Chance from 'chance';
import TreeModel from 'tree-model';
import { sample, filter } from 'lodash';

let request;
let chance;

let accounts;
let categoryList;
let incomeCategoryList;
let expenseCategoryList;

test.before(async () => {
  chance = new Chance();
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

  const updatedAccount = res.body.accounts.find(account => account._id === accountToCheck._id);

  t.is(updatedAccount.currentBalance, 100);
  t.is(updatedAccount.startBalance, 0);
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

  const updatedAccount = res.body.accounts.find(account => account._id === accountToCheck._id);

  t.is(updatedAccount.currentBalance, -100);
  t.is(updatedAccount.startBalance, 0);
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

  const updatedAccount = res.body.accounts.find(account => account._id === accountToCheck._id);

  t.is(updatedAccount.currentBalance, 400);
  t.is(updatedAccount.startBalance, 0);

  res = await request.get('/api/operation/list');

  t.is(res.status, 200);
  t.is(res.body.total, 3);
  t.is(res.body.operations[0].balance, 400);
  t.is(res.body.operations[1].balance, 600);
  t.is(res.body.operations[2].balance, 500);
});

// test.serial('update operation date', async (t) => {

// });

// test.serial('update operation amount', async (t) => {

// });

// test.serial('update operation account', async (t) => {

// });

// test.serial('remove operation at start', async (t) => {

// });

// test.serial('remove operation at end', async (t) => {

// });

// test.serial('remove operation at end', async (t) => {

// });

// test.serial('account with start balance', async (t) => {

// });

// test.serial('update account start balance', async (t) => {

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
