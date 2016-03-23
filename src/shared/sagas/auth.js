import { takeEvery } from 'redux-saga';
import { put } from 'redux-saga/effects';
import { get } from 'lodash';
import { authActions, localeActions } from '../actions';

const onAuth = function * onAuth(action) {
  yield put(authActions.setToken(get(action, 'payload.data.token')));
  yield put(authActions.getProfile());
};

const onProfile = function * onProfile(action) {
  yield put(localeActions.load(get(action, 'payload.data.profile.settings.locale')));
};

const onSettings = function * onSettings(action) {
  yield put(localeActions.load(get(action, 'payload.data.locale')));
};

export default function *() {
  yield [
    takeEvery(['LOGIN_RESOLVED', 'REGISTER_RESOLVED'], onAuth),
    takeEvery('GET_PROFILE_RESOLVED', onProfile),
    takeEvery('SET_SETTINGS_RESOLVED', onSettings),
  ];
}
