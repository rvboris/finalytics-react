import fs from 'fs';
import randomstring from 'randomstring';
import passport from 'koa-passport';
import { Strategy as LocalStrategy } from 'passport-local';
import { OAuth2Strategy as GoogleStrategy } from 'passport-google-oauth';
import { Strategy as FacebookStrategy } from 'passport-facebook';
import { Strategy as TwitterStrategy } from 'passport-twitter';

import { UserModel } from '../models';
import { error } from '../../shared/log';
import tokenExtractor from '../utils/token-extractor';
import JwtStrategy from '../utils/jwt-strategy';
import config from '../../shared/config';

const tokenKey = fs.readFileSync(`./keys/token-private-${config.env}.pem`);

const localStrategyOptions = {
  usernameField: 'email',
  passwordField: 'password',
  session: false,
};

const jwtStrategyOptions = {
  secretOrKey: tokenKey,
  jwtFromRequest: tokenExtractor,
};

const googleStrategyOptions = {
  clientID: config.google.clientId,
  clientSecret: config.google.clientSecret,
  callbackURL: `${config.apiUrl}/auth/google/callback`,
};

const facebookStrategyOptions = {
  clientID: config.facebook.clientId,
  clientSecret: config.facebook.clientSecret,
  callbackURL: `${config.apiUrl}/auth/facebook/callback`,
  profileFields: ['email'],
};

const twitterStrategyOptions = {
  consumerKey: config.twitter.clientId,
  consumerSecret: config.twitter.clientSecret,
  callbackURL: `${config.apiUrl}/auth/twitter/callback`,
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

const oauthHandler = (provider) => async (accessToken, refreshToken, profile, cb) => {
  let user;

  const emails = (profile.emails || []).map((item) => item.value);

  try {
    user = await UserModel.findOne({
      $or: [
        { [`${provider}Id`]: profile.id },
        { email: { $in: emails } },
      ],
    });

    if (user) {
      if (!user[`${provider}Id`]) {
        user[`${provider}Id`] = profile.id;
        await user.save();
      }

      cb(null, user);
      return;
    }

    const password = randomstring.generate(8);

    user = new UserModel({ [`${provider}Id`]: profile.id });
    user.email = emails.length ? emails[0] : `no-email-${profile.id}@${provider}.com`;

    await user.setPassword(password, password);
    await user.save();

    cb(null, user);
  } catch (e) {
    error(e);
    cb(e, false);
    return;
  }

  cb(null, user);
};

passport.use(new GoogleStrategy(googleStrategyOptions, oauthHandler('google')));
passport.use(new FacebookStrategy(facebookStrategyOptions, oauthHandler('facebook')));
passport.use(new TwitterStrategy(twitterStrategyOptions, oauthHandler('twitter')));

export default passport.initialize();
