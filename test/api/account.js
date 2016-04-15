import agent from '../agent';
import test from 'ava';
import mongoose from 'mongoose';
import randomstring from 'randomstring';
import { sample } from 'lodash';

let request;

test.before(async () => {
  request = await agent();

  await request.post('/api/auth/register').send({
    email: 'test@account.ru',
    password: '12345678',
    repeatPassword: '12345678',
  });
});

test.serial('load default', async (t) => {
  const res = await request.get('/api/account/load');

  t.is(res.status, 200);
  t.true(typeof res.body.accounts === 'object');
  t.is(res.body.accounts.length, 2);

  for (const { name } of res.body.accounts) {
    t.true(typeof name === 'string');
  }
});

test.serial('load', async (t) => {
  await request.post('/api/user/status').send({ status: 'ready' });

  const res = await request.get('/api/account/load');

  t.is(res.status, 200);
  t.true(typeof res.body.accounts === 'object');
  t.is(res.body.accounts.length, 2);

  for (const { name } of res.body.accounts) {
    t.true(typeof name === 'string');
  }
});

test.serial('add', async (t) => {
  let res = await request.get('/api/currency/load');
  const currencyList = res.body.currencyList;

  res = await request.post('/api/account/add').send({});

  t.is(res.status, 400);
  t.is(res.body.error, 'account.add.error.name.required');

  res = await request.post('/api/account/add').send({
    name: 'test',
  });

  t.is(res.status, 400);
  t.is(res.body.error, 'account.add.error.startBalance.required');

  res = await request.post('/api/account/add').send({
    name: 'test',
    startBalance: 10,
  });

  t.is(res.status, 400);
  t.is(res.body.error, 'account.add.error.type.required');

  res = await request.post('/api/account/add').send({
    name: 'test',
    startBalance: 10,
    type: 'debt',
  });

  t.is(res.status, 400);
  t.is(res.body.error, 'account.add.error.currency.required');

  res = await request.post('/api/account/add').send({
    name: 'test',
    startBalance: 10,
    type: 'debt',
    currency: 'wrong',
    order: 'wrong',
  });

  t.is(res.status, 400);
  t.is(res.body.error, 'account.add.error.order.invalid');

  res = await request.post('/api/account/add').send({
    name: 'test',
    startBalance: 'wrong',
    type: 'debt',
    currency: 'wrong',
  });

  t.is(res.status, 400);
  t.is(res.body.error, 'account.add.error.startBalance.invalid');

  res = await request.post('/api/account/add').send({
    name: 'test',
    startBalance: 10,
    type: 'debt',
    currency: 'wrong',
  });

  t.is(res.status, 400);
  t.is(res.body.error, 'account.add.error.currency.invalid');

  res = await request.post('/api/account/add').send({
    name: 'test',
    startBalance: 10,
    type: 'debt',
    currency: mongoose.Types.ObjectId(),
  });

  t.is(res.status, 400);
  t.is(res.body.error, 'account.add.error.currency.notFound');

  res = await request.post('/api/account/add').send({
    name: 'test',
    startBalance: 10,
    type: 'debt',
    currency: sample(currencyList)._id,
  });

  t.is(res.status, 400);
  t.is(res.body.error, 'account.add.error.startBalance.positive');

  res = await request.post('/api/account/add').send({
    name: 'test',
    startBalance: -10,
    type: 'standart',
    currency: sample(currencyList)._id,
  });

  t.is(res.status, 400);
  t.is(res.body.error, 'account.add.error.startBalance.negative');

  res = await request.post('/api/account/add').send({
    name: 'test',
    startBalance: -10,
    type: 'wrong',
    currency: sample(currencyList)._id,
  });

  t.is(res.status, 500);

  res = await request.post('/api/account/add').send({
    name: 'debt',
    startBalance: -100,
    type: 'debt',
    currency: sample(currencyList)._id,
  });

  t.is(res.status, 200);

  res = await request.get('/api/account/load');

  t.is(res.body.accounts.length, 3);

  res = await request.post('/api/account/add').send({
    name: 'debt',
    startBalance: 10,
    type: 'standart',
    currency: sample(currencyList)._id,
  });

  t.is(res.status, 400);
  t.is(res.body.error, 'account.add.error.name.exist');
});

test.serial('update', async (t) => {
  let res = await request.get('/api/account/load');

  const accounts = res.body.accounts;

  res = await request.post('/api/account/update').send({});

  t.is(res.status, 400);
  t.is(res.body.error, 'account.update.error._id.required');

  res = await request.post('/api/account/update').send({ _id: 'wrong id' });

  t.is(res.status, 400);
  t.is(res.body.error, 'account.update.error._id.invalid');

  res = await request.post('/api/account/update').send({ _id: mongoose.Types.ObjectId() });

  t.is(res.status, 400);
  t.is(res.body.error, 'account.update.error._id.notFound');

  res = await request.post('/api/account/update').send({
    _id: sample(accounts)._id,
    startBalance: 'wrong balance',
  });

  t.is(res.status, 400);
  t.is(res.body.error, 'account.update.error.startBalance.invalid');

  res = await request.post('/api/account/update').send({
    _id: sample(accounts.filter(account => account.type === 'debt'))._id,
    startBalance: 10,
  });

  t.is(res.status, 400);
  t.is(res.body.error, 'account.update.error.startBalance.positive');

  res = await request.post('/api/account/update').send({
    _id: sample(accounts.filter(account => account.type === 'standart'))._id,
    startBalance: -10,
  });

  t.is(res.status, 400);
  t.is(res.body.error, 'account.update.error.startBalance.negative');

  res = await request.post('/api/account/update').send({
    _id: sample(accounts.filter(account => account.type === 'debt'))._id,
    name: 'debt',
  });

  t.is(res.status, 400);
  t.is(res.body.error, 'account.update.error.name.exist');

  let accountToCheck = sample(accounts);

  res = await request.post('/api/account/update').send({ _id: accountToCheck._id });

  t.is(res.status, 200);
  t.true(typeof res.body.accounts === 'object');
  t.is(res.body.accounts.length, accounts.length);

  let updatedAccount = res.body.accounts.find(account => account._id === accountToCheck._id);

  t.true(typeof updatedAccount === 'object');
  t.is(updatedAccount.name, accountToCheck.name);
  t.is(updatedAccount.startBalance, accountToCheck.startBalance);
  t.is(updatedAccount.status, accountToCheck.status);
  t.is(updatedAccount.order, accountToCheck.order);

  accountToCheck = sample(accounts);
  const nameToCheck = randomstring.generate(8);

  res = await request.post('/api/account/update').send({
    _id: accountToCheck._id,
    name: nameToCheck,
  });

  t.is(res.status, 200);
  t.true(typeof res.body.accounts === 'object');
  t.is(res.body.accounts.length, accounts.length);

  updatedAccount = res.body.accounts.find(account => account._id === accountToCheck._id);

  t.true(typeof updatedAccount === 'object');
  t.is(updatedAccount.name, nameToCheck);
  t.is(updatedAccount.startBalance, accountToCheck.startBalance);
  t.is(updatedAccount.status, accountToCheck.status);
  t.is(updatedAccount.order, accountToCheck.order);
});

test.serial('delete', async (t) => {
  let res = await request.get('/api/account/load');

  const { accounts } = res.body;

  res = await request.post('/api/account/delete').send({});

  t.is(res.status, 400);
  t.is(res.body.error, 'account.delete.error._id.required');

  res = await request.post('/api/account/delete').send({
    _id: 'wrong',
  });

  t.is(res.status, 400);
  t.is(res.body.error, 'account.delete.error._id.invalid');

  res = await request.post('/api/account/delete').send({
    _id: mongoose.Types.ObjectId(),
  });

  t.is(res.status, 400);
  t.is(res.body.error, 'account.delete.error._id.notFound');

  for (const { _id } of accounts) {
    res = await request.post('/api/account/delete').send({ _id });

    t.is(res.status, 200);
    t.is(res.body.accounts.find(account => account._id === _id), undefined);
  }
});
