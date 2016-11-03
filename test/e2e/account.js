import test from 'ava';
import Nightmare from 'nightmare';

const nm = new Nightmare({ show: !process.env.CI });

test.before(async () => {
  await nm
    .goto(`${process.env.startPoint}/register`)
    .insert('form input[name=email]', 'account@account.ru')
    .insert('form input[name=password]', '12345678')
    .insert('form input[name=repeatPassword]', '12345678')
    .click('form button[type=submit]')
    .wait(2000);
});

test.serial('default accounts', async (t) => {
  await nm
    .goto(`${process.env.startPoint}/dashboard/accounts`)
    .evaluate(() => document.querySelectorAll('.list-group-item.list-group-item-action').length)
    .then((defaultAccountsCount) => {
      t.is(defaultAccountsCount, 2);
    });
});

test.serial('remove default accounts', async (t) => {
  const selectAccount = (ctx) =>
    ctx
    .click('.list-group-item.list-group-item-action')
    .click('form .btn-danger')
    .wait(500)
    .click('.modal-footer .btn-danger')
    .wait(500)
    .evaluate(() => document.querySelectorAll('.list-group-item.list-group-item-action').length);

  await nm.goto(`${process.env.startPoint}/dashboard/accounts`);

  await selectAccount(nm)
    .then((defaultAccountsCount) => {
      t.is(defaultAccountsCount, 1);
    });

  await selectAccount(nm)
    .then((defaultAccountsCount) => {
      t.is(defaultAccountsCount, 0);
    });
});

test.serial('create new account', async (t) => {
  await nm
    .goto(`${process.env.startPoint}/dashboard/accounts`)
    .click('div > div > .btn.btn-block')
    .insert('form input[name="name"]', 'test account')
    .insert('form input[name="startBalance"]', '100')
    .click('form button[type=submit]')
    .wait(1000)
    .evaluate(() => document.querySelectorAll('.list-group-item.list-group-item-action').length)
    .then((accountsCount) => {
      t.is(accountsCount, 1);
    });
});

test.serial('update account', async (t) => {
  await nm
    .goto(`${process.env.startPoint}/dashboard/accounts`)
    .click('.list-group-item.list-group-item-action')
    .insert('form input[name="name"]', false)
    .insert('form input[name="name"]', 'updated')
    .insert('form input[name="startBalance"]', '200')
    .click('form button[type=submit]')
    .wait(1000)
    .evaluate(() => document.querySelector('.list-group-item.list-group-item-action').innerText)
    .then((accountName) => {
      t.is(accountName, 'updated');
    });
});

test.after(async () => {
  await nm.end();
});
