import test from 'ava';
import Nightmare from 'nightmare';

const nm = new Nightmare({ show: !process.env.CI });

test.before(async () => {
  await nm
    .goto(`${process.env.startPoint}/register`)
    .wait(1000)
    .insert('form input[name=email]', 'category@category.ru')
    .insert('form input[name=password]', '12345678')
    .insert('form input[name=repeatPassword]', '12345678')
    .click('form button[type=submit]')
    .wait(2000);
});

test.serial('default categories', async (t) => {
  nm
    .goto(`${process.env.startPoint}/dashboard/categories`)
    .evaluate(() => document.querySelectorAll('.btn.btn-block + div > div').length)
    .then((defaultCategoriesCount) => {
      t.true(defaultCategoriesCount => 3);
    });
});

test.serial('remove default category', async (t) => {
  const selectCategoriesCount = (ctx) => ctx
    .evaluate(() => document.querySelectorAll('.btn.btn-block + div > div').length);

  const categoriesCount = await selectCategoriesCount(nm);

  await nm
    .click('.btn.btn-block + div > div:last-child button:last-child')
    .click('form .btn-danger')
    .wait(500)
    .click('.modal-footer .btn-danger')
    .wait(500);

  await nm.goto(`${process.env.startPoint}/dashboard/categories`);

  const categoriesCountAfterDelete = await selectCategoriesCount(nm);

  t.true(categoriesCountAfterDelete < categoriesCount);
});

test.serial('create new category', async (t) => {
  const selectCategoriesCount = (ctx) => ctx
    .evaluate(() => document.querySelectorAll('.btn.btn-block + div > div').length);

  const categoriesCount = await selectCategoriesCount(nm);

  await nm
    .goto(`${process.env.startPoint}/dashboard/categories`)
    .click('div > div > .btn.btn-block')
    .insert('form input[name="name"]', 'test category')
    .click('form button[type=submit]')
    .wait(1000);

  await nm.goto(`${process.env.startPoint}/dashboard/categories`);

  const categoriesCountAfterCreate = await selectCategoriesCount(nm);

  t.true(categoriesCountAfterCreate > categoriesCount);
});

test.serial('update category', async (t) => {
  await nm
    .goto(`${process.env.startPoint}/dashboard/categories`)
    .click('.btn.btn-block + div > div:last-child button:last-child')
    .insert('form input[name="name"]', false)
    .insert('form input[name="name"]', 'updated')
    .click('form button[type=submit]')
    .wait(1000)
    .evaluate(() =>
      document
      .querySelector('.btn.btn-block + div > div:last-child span > span')
      .innerText
    )
    .then((categoryName) => {
      t.is(categoryName, 'updated');
    });
});

test.after(async () => {
  await nm.end();
});
