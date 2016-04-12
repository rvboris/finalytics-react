import agent from '../agent';
import test from 'ava';

let request;

test.before(async () => {
  request = await agent();

  await request.post('/api/auth/register').send({
    email: 'test@test.ru',
    password: '12345678',
    repeatPassword: '12345678',
  });
});

test.serial('load default', async (t) => {
  const res = await request.get('/api/account/load');

  t.is(res.status, 200);
  t.true(typeof res.body.accounts === 'object');

  for (const { name } of res.body.accounts) {
    t.true(typeof name === 'string');
  }
});

test.serial('load', async (t) => {
  await request.post('/api/user/status').send({ status: 'ready' });

  const res = await request.get('/api/account/load');

  t.is(res.status, 200);
  t.true(typeof res.body.accounts === 'object');

  for (const { name } of res.body.accounts) {
    t.true(typeof name === 'string');
  }
});
