import passport from 'koa-passport';
import cookie from 'cookie';
import { get } from 'lodash';
import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
import { Strategy as LocalStrategy } from 'passport-local';
import { UserModel } from '../models';
import { error } from '../../shared/log';

const localStrategyOptions = {
  usernameField: 'email',
  passwordField: 'password',
  session: false,
};

passport.use(new LocalStrategy(localStrategyOptions, async (email, password, done) => {
  let user;

  try {
    user = await UserModel.findOne({ email });
  } catch (e) {
    error(e);
    done(e, false);
    return;
  }

  if (user && await user.authenticate(password)) {
    done(null, user);
    return;
  }

  done(null, false);
}));

const tokenExtractor = (req) => {
  let token = null;

  token = ExtractJwt.fromAuthHeader()(req);

  if (token) {
    return token;
  }

  const cookies = cookie.parse(get(req, 'header.cookie') || '');

  return cookies.jwt || token;
};

const jwtStrategyOptions = {
  secretOrKey: 'secret',
  jwtFromRequest: tokenExtractor,
};

passport.use(new JwtStrategy(jwtStrategyOptions, async (payload, done) => {
  let user;

  try {
    user = await UserModel.findOne(payload.id);
  } catch (e) {
    error(e);
    done(e, false);
    return;
  }

  if (user) {
    done(null, user);
    return;
  }

  done(null, false);
}));

export default passport.initialize();
