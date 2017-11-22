import Cookies from 'cookies';
import { ExtractJwt } from 'passport-jwt';

import config from '../../shared/config';
import { store, cookieSettings, cookiePrefix } from '../middlewares/session';

export default (req) => new Promise(async (resolve) => {
  const token = ExtractJwt.fromAuthHeaderWithScheme('jwt')(req);

  if (token) {
    resolve(token);
    return;
  }

  const options = Object.assign({}, cookieSettings, { keys: config.sessionKeys });
  const cookie = new Cookies(req, null, options);
  const sid = cookie.get(cookiePrefix);

  if (sid) {
    const session = await store.get(sid);

    if (session && session.token) {
      resolve(session.token);
      return;
    }
  }

  console.log('no token');
  resolve(null);
});
