import test from 'ava';
import Nightmare from 'nightmare';

test.beforeEach(t => {
  t.context.nm = new Nightmare({ show: !process.env.CI });
});

test('signup', async (t) => {
  try {
    await (t.context.nm.goto(process.env.startPoint).end());
  } catch (e) {
    t.fail(e);
  }

  t.pass();
});
