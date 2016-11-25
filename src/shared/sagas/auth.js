import { takeLatest } from 'redux-saga';
import { select, fork, put, take } from 'redux-saga/effects';
import { get } from 'lodash';
import {
  authActions,
  localeActions,
  categoryActions,
  accountActions,
  currencyActions,
  dashboardActions,
} from '../actions';

function* prepareDashboard() {
  const dashboardRequiredData = [
    'CATEGORY_LOAD_RESOLVED',
    'ACCOUNT_LOAD_RESOLVED',
    'CURRENCY_LOAD_RESOLVED',
  ];

  if (IS_CLIENT) {
    yield [
      put(categoryActions.load()),
      put(accountActions.load()),
      put(currencyActions.load()),
    ];

    while (true) {
      yield take(dashboardRequiredData);
      yield take(dashboardRequiredData);
      yield take(dashboardRequiredData);
      break;
    }

    yield put(dashboardActions.ready());
  }
}

function* onUserReady() {
  const initUserActions = [
    'AUTH_SET_SETTINGS_RESOLVED',
    'CATEGORY_LOAD_RESOLVED',
    'ACCOUNT_LOAD_RESOLVED',
  ];

  while (true) {
    yield take(initUserActions);
    yield take(initUserActions);
    yield take(initUserActions);
    break;
  }

  yield put(authActions.setStatus('ready'));
}

function* userTimezoneLocale() {
  if (IS_CLIENT) {
    yield put(authActions.setSettings({
      timezone: new Date().getTimezoneOffset(),
      locale: 'auto',
    }));
  }
}

function* onProfile(action) {
  yield put(localeActions.load(get(action, 'payload.data.profile.settings.locale')));
}

function* onSettings(action) {
  yield put(localeActions.load(get(action, 'payload.data.locale')));
}

function* onAuth(action) {
  yield put(authActions.setToken(get(action, 'payload.data.token')));
  yield put(authActions.getProfile());

  yield take('AUTH_GET_PROFILE_RESOLVED');

  const auth = yield select((state) => state.auth);

  if (get(auth, 'profile.status') === 'init') {
    yield fork(userTimezoneLocale);
  }

  yield fork(prepareDashboard);
}

export default function* () {
  yield fork(onUserReady);

  yield [
    takeLatest(['AUTH_LOGIN_RESOLVED', 'AUTH_REGISTER_RESOLVED'], onAuth),
    takeLatest('AUTH_GET_PROFILE_RESOLVED', onProfile),
    takeLatest('AUTH_SET_SETTINGS_RESOLVED', onSettings),
  ];
}
