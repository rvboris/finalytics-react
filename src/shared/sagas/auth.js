import { take, put, fork } from 'redux-saga/effects';
import { authActions, localeActions } from '../actions';

const onAuth = function * onAuth() {
  while (true) {
    const token = (yield take(['LOGIN_RESOLVED', 'REGISTER_RESOLVED'])).payload.data.token;
    yield put(authActions.setToken(token));
    yield put(authActions.getProfile());
  }
};

const onProfile = function * onProfile() {
  while (true) {
    const profile = (yield take('GET_PROFILE_RESOLVED')).payload.data;
    yield put(localeActions.load(profile.settings.locale));
  }
};

export default function *() {
  yield fork(onAuth);
  yield fork(onProfile);
}
