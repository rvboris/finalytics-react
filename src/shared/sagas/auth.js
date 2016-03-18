import { take, put } from 'redux-saga/effects';
import { authActions, localeActions } from '../actions';

export default function *() {
  while (true) {
    const token = (yield take(['LOGIN_RESOLVED', 'REGISTER_RESOLVED'])).payload.data.token;
    yield put(authActions.setToken(token));
    yield put(authActions.getProfile());

    const profile = (yield take('GET_PROFILE_RESOLVED')).payload.data;
    yield put(localeActions.load(profile.settings.locale));
  }
}
