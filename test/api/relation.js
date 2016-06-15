import agent from '../agent';
import test from 'ava';

let request;

test.before(async () => {
  request = await agent();

  await request.post('/api/auth/register').send({
    email: 'test@relation.ru',
    password: '12345678',
    repeatPassword: '12345678',
  });
});

test.serial('remove operation', async (t) => {

});

test.serial('remove transfer operation', async (t) => {

});

test.serial('remove account', async (t) => {

});

test.serial('remove category', async (t) => {

});

test.serial('remove root category', async (t) => {

});

test.serial('remove user', async (t) => {

});
