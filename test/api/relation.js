import agent from '../agent';
import test from 'ava';
import moment from 'moment';
import Chance from 'chance';
import TreeModel from 'tree-model';
import { sample, filter } from 'lodash';

let request;
let chance;

test.before(async () => {
  chance = new Chance();
  request = await agent();

  await request.post('/api/auth/register').send({
    email: 'test@relation.ru',
    password: '12345678',
    repeatPassword: '12345678',
  });
});

test.serial('remove account', async (t) => {
  let res = await request.get('/api/account/load');

  let { accounts } = res.body;
  const accountToRemove = accounts[0];

  res = await request.get('/api/category/load');

  const tree = new TreeModel();
  const categoryRoot = tree.parse(res.body.data);
  const categoryList = categoryRoot.all();
  const incomeCategoryList = filter(categoryList, category => category.model.type === 'income');

  for (let i = 5; i >= 1; i--) {
    const amount = chance.integer({ min: 1, max: 100 });

    res = await request.post('/api/operation/add').send({
      created: moment().utc(),
      account: accounts[0]._id,
      category: sample(incomeCategoryList).model._id,
      amount,
    });

    t.is(res.status, 200);
  }

  for (let i = 5; i >= 1; i--) {
    res = await request.post('/api/operation/addTransfer').send({
      created: moment().utc(),
      accountFrom: accounts[0]._id,
      accountTo: accounts[1]._id,
      amountFrom: chance.integer({ min: 1, max: 100 }),
      amountTo: chance.integer({ min: 1, max: 100 }),
    });

    accounts = accounts.reverse();

    t.is(res.status, 200);
  }

  res = await request.get('/api/operation/list');
  t.is(res.body.total, 10);

  res = await request.post('/api/account/delete').send({ _id: accountToRemove._id });

  t.is(res.status, 200);
  t.true(res.body.accounts.every(account => account._id !== accountToRemove._id));

  res = await request.get('/api/operation/list');

  t.is(res.body.total, 0);
});

test.serial('remove category', async (t) => {
  let res = await request.get('/api/account/load');

  const { accounts } = res.body;

  res = await request.get('/api/category/load');

  const tree = new TreeModel();
  const categoryRoot = tree.parse(res.body.data);
  const categoryList = categoryRoot.all();
  const categoriesToRemove = filter(categoryList, category =>
    !(category.model.children && category.model.system) && category.model.type === 'expense');
  const categoriesToRemoveRoots = filter(categoryList, category =>
    !category.model.system && category.model.type === 'expense' && category.model.children);
  const blankCategoryId = categoryRoot.first(node => node.model.blank === true).model._id;

  let categoryId = sample(categoriesToRemove).model._id;

  res = await request.post('/api/operation/add').send({
    created: moment().utc(),
    account: accounts[0]._id,
    category: categoryId,
    amount: -100,
  });
  t.is(res.status, 200);

  res = await request.post('/api/category/delete').send({ _id: categoryId });
  t.is(res.status, 200);

  res = await request.get('/api/operation/list');
  t.is(res.status, 200);
  t.is(res.body.total, 1);

  let operationToCheck = res.body.operations[0];

  t.is(operationToCheck.category, blankCategoryId);

  categoryId = sample(categoriesToRemoveRoots).model._id;

  res = await request.post('/api/operation/add').send({
    created: moment().utc(),
    account: accounts[0]._id,
    category: categoryId,
    amount: -100,
  });
  t.is(res.status, 200);

  res = await request.post('/api/category/delete').send({ _id: categoryId });
  t.is(res.status, 200);

  res = await request.get('/api/operation/list').query({ skip: 1 });
  t.is(res.status, 200);
  t.is(res.body.total, 2);

  operationToCheck = res.body.operations[0];

  t.is(operationToCheck.category, blankCategoryId);
});
