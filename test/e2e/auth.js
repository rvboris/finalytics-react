import test from 'ava';
import Nightmare from 'nightmare';

const nm = new Nightmare({ show: !process.env.CI });

test.serial('register', async (t) => {
  await nm
    .goto(`${process.env.startPoint}/register`)
    .insert('form input[name=email]', 'auth@auth.ru')
    .insert('form input[name=password]', '12345678')
    .insert('form input[name=repeatPassword]', '12345678')
    .click('form button[type=submit]')
    .wait('.navbar > .navbar-brand')
    .url()
    .then((url) => {
      t.is(url, `${process.env.startPoint}/dashboard/operations`);
    });
});

test.serial('logout', async (t) => {
  await nm
    .goto(`${process.env.startPoint}/dashboard`)
    .click('a[href="/logout"]')
    .wait(3000)
    .url()
    .then((url) => {
      t.is(url, `${process.env.startPoint}/login`);
    });
});

test.serial('login', async (t) => {
  await nm
    .goto(`${process.env.startPoint}/login`)
    .insert('form input[name=email]', 'auth@auth.ru')
    .insert('form input[name=password]', '12345678')
    .click('form button[type=submit]')
    .wait('.navbar > .navbar-brand')
    .url()
    .then((url) => {
      t.is(url, `${process.env.startPoint}/dashboard/operations`);
    });
});

test.after(async () => {
  await nm.end();
});
