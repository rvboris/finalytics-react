import Router from 'koa-66';
import passport from 'koa-passport';
import jwt from 'jsonwebtoken';
import moment from 'moment';

import { UserModel } from '../models';
import { error } from '../../shared/log';

const router = new Router();

const getToken = (user) => jwt.sign({ id: user._id }, 'secret', { expiresIn: '7 days' });

const setTokenCookie = (ctx, token) => {
  ctx.cookies.set('jwt', token, {
    expires: moment(moment.utc()).add(7, 'days').toDate(),
  });
};

router.post('/login', (ctx, next) =>
  passport.authenticate('local', (user) => {
    if (!user) {
      ctx.cookies.set('jwt', '');
      ctx.status = 401;
      ctx.body = { error: 'auth.login.error.password.invalid' };
      return;
    }

    const token = getToken(user);

    setTokenCookie(ctx, token);

    ctx.body = { token };
  })(ctx, next)
);

router.post('/register', async (ctx) => {
  const user = new UserModel({ email: ctx.request.body.email });

  const setPassword = await user.setPassword(
    ctx.request.body.password,
    ctx.request.body.repeatPassword
  );

  if (setPassword.error) {
    ctx.body = setPassword;
    ctx.status = 400;
    return;
  }

  try {
    await user.save();
  } catch (e) {
    ctx.status = 400;

    if (e.errors.email) {
      ctx.body = { error: e.errors.email.message };

      return;
    }

    ctx.status = 500;
    ctx.body = { error: 'global.error.technical' };

    error(e);

    return;
  }

  const token = getToken(user);

  setTokenCookie(ctx, token);

  ctx.body = { token };
});

router.post('/logout', { jwt: true }, (ctx) => {
  ctx.cookies.set('jwt', '');
  ctx.status = 200;
});

export default router;
