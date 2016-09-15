import { takeLatest } from 'redux-saga';
import { select, fork, put, take } from 'redux-saga/effects';
import { get } from 'lodash';
import {
  authActions,
  localeActions,
  categoryActions,
  accountActions,
  currencyActions,
} from '../actions';

const userTimezoneLocale = function* userTimezoneLocale() {
  if (IS_CLIENT) {
    yield put(authActions.setSettings({
      timezone: new Date().getTimezoneOffset(),
      locale: 'auto',
    }));
  }
};

const prepareUserData = function* prepareUser() {
  if (IS_CLIENT) {
    const category = yield select((state) => state.category);

    if (!category.data) {
      yield put(categoryActions.load());
    }

    const accounts = yield select((state) => get(state, 'account.accounts'));

    if (!accounts) {
      yield put(accountActions.load());
    }

    const currencyList = yield select((state) => get(state, 'currency.currencyList'));

    if (!currencyList) {
      yield put(currencyActions.load());
    }
  }
};

const onUserReady = function* userReady() {
  const initUserActions = [
    'AUTH_SET_SETTINGS_RESOLVED',
    'CATEGORY_LOAD_RESOLVED',
    'ACCOUNT_LOAD_RESOLVED',
  ];

  while (true) {
    yield take(initUserActions);
    yield take(initUserActions);
    yield take(initUserActions);
    yield put(authActions.setStatus('ready'));
    break;
  }
};

const onAuth = function* onAuth(action) {
  yield put(authActions.setToken(get(action, 'payload.data.token')));
  yield put(authActions.getProfile());

  const auth = yield select((state) => state.auth);

  if (get(auth, 'profile.status') === 'init') {
    yield fork(userTimezoneLocale);
  }

  yield fork(prepareUserData);
};

const onProfile = function* onProfile(action) {
  yield put(localeActions.load(get(action, 'payload.data.profile.settings.locale')));
};

const onSettings = function* onSettings(action) {
  yield put(localeActions.load(get(action, 'payload.data.locale')));
};

export default function* () {
  yield fork(onUserReady);

  yield [
    takeLatest(['AUTH_LOGIN_RESOLVED', 'AUTH_REGISTER_RESOLVED'], onAuth),
    takeLatest('AUTH_GET_PROFILE_RESOLVED', onProfile),
    takeLatest('AUTH_SET_SETTINGS_RESOLVED', onSettings),
  ];
}
