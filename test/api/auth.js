import agent from '../agent';
import test from 'ava';

let request;

test.before(async () => {
  request = await agent();
});

test.serial('register local strategy', async t => {
  const res = await request.post('/api/auth/register').send({
    email: 'test@test.ru',
    password: '12345678',
    repeatPassword: '12345678',
  });

  t.is(res.status, 200);
  t.is(res.headers['set-cookie'].length, 2);
  t.true(res.headers['set-cookie'][0].startsWith('koa.sid'));
  t.true(res.headers['set-cookie'][1].startsWith('koa.sid.sig'));
});

test.serial('logout', async t => {
  const res = await request.post('/api/auth/logout');

  t.is(res.status, 200);
  t.is(res.headers['set-cookie'].length, 1);
});

test.serial('login wrong password', async t => {
  const res = await request.post('/api/auth/login').send({
    email: 'test@test.ru',
    password: '1234567890',
  });

  t.is(res.status, 401);
  t.is(res.body.error, 'auth.login.error.password.invalid');
});

test.serial('login wrong email', async t => {
  const res = await request.post('/api/auth/login').send({
    email: 'test1@test1.ru',
    password: '12345678',
  });

  t.is(res.status, 401);
  t.is(res.body.error, 'auth.login.error.password.invalid');
});

test.serial('login', async t => {
  const res = await request.post('/api/auth/login').send({
    email: 'test@test.ru',
    password: '12345678',
  });

  t.is(res.status, 302);
  t.is(res.headers.location, '/dashboard');
  t.is(res.headers['set-cookie'].length, 2);
  t.true(res.headers['set-cookie'][0].startsWith('koa.sid'));
  t.true(res.headers['set-cookie'][1].startsWith('koa.sid.sig'));
});

test.serial('login authorized', async t => {
  const res = await request.post('/api/auth/login').send({
    email: 'test@test.ru',
    password: '12345678',
  });

  t.is(res.status, 302);
  t.is(res.headers.location, '/dashboard');
});

test.serial('register local strategy exist', async t => {
  const res = await request.post('/api/auth/register').send({
    email: 'test@test.ru',
    password: '12345678',
    repeatPassword: '12345678',
  });

  t.is(res.status, 400);
  t.is(res.body.error, 'auth.register.error.email.unique');
});

test.serial('register local strategy authorized', async t => {
  const res = await request.post('/api/auth/register').send({
    email: 'test3@test3.ru',
    password: '12345678',
    repeatPassword: '12345678',
  });

  t.is(res.status, 200);
  t.is(res.headers['set-cookie'].length, 2);
  t.true(res.headers['set-cookie'][0].startsWith('koa.sid'));
  t.true(res.headers['set-cookie'][1].startsWith('koa.sid.sig'));
});

test.serial('login again authorized', async t => {
  const res = await request.post('/api/auth/login').send({
    email: 'test3@test3.ru',
    password: '12345678',
  });

  t.is(res.status, 302);
  t.is(res.headers.location, '/dashboard');
});

test('register local strategy require email', async t => {
  const res = await request.post('/api/auth/register').send({
    password: '12345678',
    repeatPassword: '12345678',
  });

  t.is(res.status, 400);
  t.is(res.body.error, 'auth.register.error.email.required');
});

test('register local strategy invalid email', async t => {
  const res = await request.post('/api/auth/register').send({
    email: 'test',
    password: '12345678',
    repeatPassword: '12345678',
  });

  t.is(res.status, 400);
  t.is(res.body.error, 'auth.register.error.email.invalid');
});

test('register local strategy require password', async t => {
  const res = await request.post('/api/auth/register').send({
    email: 'email@email.ru',
    repeatPassword: '12345678',
  });

  t.is(res.status, 400);
  t.is(res.body.error, 'auth.register.error.password.required');
});

test('register local strategy short password', async t => {
  const res = await request.post('/api/auth/register').send({
    email: 'email@email.ru',
    password: '1234567',
    repeatPassword: '1234567',
  });

  t.is(res.status, 400);
  t.is(res.body.error, 'auth.register.error.password.short');
});

test('register local strategy require repeat password', async t => {
  const res = await request.post('/api/auth/register').send({
    email: 'email@email.ru',
    password: '1234567',
  });

  t.is(res.status, 400);
  t.is(res.body.error, 'auth.register.error.repeatPassword.required');
});

test('register local strategy password equal', async t => {
  const res = await request.post('/api/auth/register').send({
    email: 'email@email.ru',
    password: '12345678',
    repeatPassword: '1234567',
  });

  t.is(res.status, 400);
  t.is(res.body.error, 'auth.register.error.password.identical');
});

test('login require email', async t => {
  const res = await request.post('/api/auth/login').send({
    password: '12345678',
  });

  t.is(res.status, 400);
  t.is(res.body.error, 'auth.login.error.email.required');
});

test('login require password', async t => {
  const res = await request.post('/api/auth/login').send({
    email: 'email@email.ru',
  });

  t.is(res.status, 400);
  t.is(res.body.error, 'auth.login.error.password.required');
});

test('login invalid email', async t => {
  const res = await request.post('/api/auth/login').send({
    email: 'email',
    password: '12345678',
  });

  t.is(res.status, 400);
  t.is(res.body.error, 'auth.login.error.email.invalid');
});

test('oauth google', async t => {
  const res = await request.get('/api/auth/google');

  t.is(res.status, 302);
});

test('oauth google callback', async t => {
  const res = await request.get('/api/auth/google/callback');

  t.is(res.status, 302);
});

test('oauth facebook', async t => {
  const res = await request.get('/api/auth/facebook');

  t.is(res.status, 302);
});

test('oauth facebook callback', async t => {
  const res = await request.get('/api/auth/facebook/callback');

  t.is(res.status, 302);
});

test('oauth twitter callback', async t => {
  const res = await request.get('/api/auth/twitter/callback');

  t.is(res.status, 302);
});
