import test from 'ava';

import agent from '../agent';

let request;

test.before(async () => {
  request = await agent();

  await request.post('/api/auth/register').send({
    email: 'test@currency.ru',
    password: '12345678',
    repeatPassword: '12345678',
  });
});

test('load', async (t) => {
  const res = await request.get('/api/currency/load');

  t.is(res.status, 200);
  t.is(res.body.currencyList.length, 118);
});
