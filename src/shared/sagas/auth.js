import moment from 'moment-timezone';
import { takeEvery } from 'redux-saga';
import { select, fork } from 'redux-saga/effects';
import { put } from 'redux-saga/effects';
import { get } from 'lodash';
import { authActions, localeActions, categoryActions } from '../actions';

const prepareUser = function * prepareUser() {
  if (__CLIENT__) {
    yield put(authActions.setSettings({
      timezone: moment.tz.guess(),
      locale: 'auto',
    }));

    const category = yield select((state) => state.category);

    if (!category.data) {
      yield put(categoryActions.load());
    }

    yield put(authActions.setStatus('ready'));
  }
};

const onAuth = function * onAuth(action) {
  yield put(authActions.setToken(get(action, 'payload.data.token')));
  yield put(authActions.getProfile());
};

const onProfile = function * onProfile(action) {
  if (action.payload.data.status === 'init') {
    yield fork(prepareUser);
  }

  yield put(localeActions.load(get(action, 'payload.data.profile.settings.locale')));
};

const onSettings = function * onSettings(action) {
  yield put(localeActions.load(get(action, 'payload.data.locale')));
};

export default function *() {
  const auth = yield select((state) => state.auth);

  if (auth.profile.status === 'init') {
    yield fork(prepareUser);
  }

  yield [
    takeEvery(['LOGIN_RESOLVED', 'REGISTER_RESOLVED'], onAuth),
    takeEvery('GET_PROFILE_RESOLVED', onProfile),
    takeEvery('SET_SETTINGS_RESOLVED', onSettings),
  ];
}
