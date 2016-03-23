import Router from 'koa-66';
import passport from 'koa-passport';
import jwt from 'jsonwebtoken';
import fs from 'fs';

import { UserModel } from '../models';
import { error } from '../../shared/log';
import config from '../../shared/config';

const router = new Router();

const tokenKey = fs.readFileSync(`./keys/token-private-${config.env}.pem`);

const getToken = (user) => jwt.sign({ id: user._id }, tokenKey, { expiresIn: '7 days' });

const oauthHandler = (provider, options) => (ctx, next) =>
  passport.authenticate(provider, options, (user) => {
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

router.post('/login', oauthHandler('local'));

router.post('/register', async (ctx) => {
  const user = new UserModel({ email: ctx.request.body.email });

  const setPassword = await user.setPassword(
    ctx.request.body.password,
    ctx.request.body.repeatPassword
  );

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
    ctx.body = { error: 'global.error.technical' };

    return;
  }

  const token = getToken(user);

  ctx.session.token = token;
  ctx.body = { token };
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
