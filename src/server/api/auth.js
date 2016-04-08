import Router from 'koa-66';
import passport from 'koa-passport';
import jwt from 'jsonwebtoken';
import isEmail from 'validator/lib/isEmail';
import { pick } from 'lodash';

import { UserModel } from '../models';
import { error } from '../../shared/log';

const router = new Router();

let tokenKey;

if (__DEVELOPMENT__) {
  tokenKey = require('../../keys/token-private-development.pem');
} else {
  tokenKey = require('../../keys/token-private-production.pem');
}

const getToken = (user) => jwt.sign({ id: user._id }, tokenKey, { expiresIn: '7 days' });

const oauthHandler = (provider, options) => async (ctx, next) => {
  const { email, password } = pick(ctx.request.body, 'email', 'password');

  if (provider === 'local') {
    if (!email) {
      ctx.status = 400;
      ctx.body = { error: 'auth.login.error.email.required' };
      return;
    }

    if (!isEmail(email)) {
      ctx.status = 400;
      ctx.body = { error: 'auth.login.error.email.invalid' };
      return;
    }

    if (!password) {
      ctx.status = 400;
      ctx.body = { error: 'auth.login.error.password.required' };
      return;
    }
  }

  await passport.authenticate(provider, options, (user) => {
    if (!user) {
      ctx.session = null;
      ctx.status = 401;
      ctx.body = { error: 'auth.login.error.password.invalid' };
      return;
    }

    const token = getToken(user);

    ctx.session.token = token;
    ctx.redirect('/dashboard');
  })(ctx, next);
};

router.post('/login', oauthHandler('local'));

router.post('/register', async (ctx) => {
  const { email, password, repeatPassword }
    = pick(ctx.request.body, 'email', 'password', 'repeatPassword');

  const user = new UserModel({ email });

  const setPassword = await user.setPassword(password, repeatPassword);

  user.settings.locale = ctx.language;

  if (setPassword.error) {
    ctx.body = setPassword;
    ctx.status = 400;
    return;
  }

  try {
    await user.save();
  } catch (e) {
    error(e);

    ctx.status = 400;

    if (e.errors && e.errors.email) {
      ctx.body = { error: e.errors.email.message };

      return;
    }

    ctx.status = 500;
    ctx.body = { error: e.message };

    return;
  }

  const token = getToken(user);

  ctx.session.token = token;
  ctx.status = 200;
});

router.post('/logout', { jwt: true }, (ctx) => {
  ctx.session = null;
  ctx.status = 200;
});

router.get('/google', (ctx, next) =>
  passport.authenticate('google', {
    scope: 'https://www.googleapis.com/auth/userinfo.email',
  })(ctx, next));

router.get('/facebook', (ctx, next) =>
  passport.authenticate('facebook')(ctx, next));

router.get('/twitter', (ctx, next) =>
  passport.authenticate('twitter')(ctx, next));

router.get('/google/callback', oauthHandler('google', { failureRedirect: '/register' }));
router.get('/facebook/callback', oauthHandler('facebook', { failureRedirect: '/register' }));
router.get('/twitter/callback', oauthHandler('twitter', { failureRedirect: '/register' }));

export default router;
