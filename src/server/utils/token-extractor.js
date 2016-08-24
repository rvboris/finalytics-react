import Cookies from 'cookies';
import co from 'co';
import { ExtractJwt } from 'passport-jwt';

import config from '../../shared/config';
import { store, cookieSettings, sessionPrefix, cookiePrefix } from '../middlewares/session';

export default co.wrap(function* tokenExtractor(req) {
  let token = null;

  token = ExtractJwt.fromAuthHeader()(req);

  if (token) {
    return yield Promise.resolve(token);
  }

  const options = Object.assign({}, cookieSettings, { keys: config.sessionKeys });
  const cookie = new Cookies(req, null, options);
  const sid = cookie.get(cookiePrefix);

  if (sid) {
    const session = yield store.get(sessionPrefix + sid);

    if (session && session.token) {
      token = session.token;
    }
  }

  return yield Promise.resolve(token);
});
