import { select, fork, put, take, takeLatest } from 'redux-saga/effects';
import { get } from 'lodash';
import {
  authActions,
  localeActions,
  categoryActions,
  accountActions,
  currencyActions,
  dashboardActions,
  balanceActions,
} from '../actions';

function* prepareDashboard() {
  const dashboardRequiredData = [
    'CATEGORY_LOAD_RESOLVED',
    'ACCOUNT_LOAD_RESOLVED',
    'CURRENCY_LOAD_RESOLVED',
    'BALANCE_TOTAL_RESOLVED',
  ];

  if (IS_CLIENT) {
    yield [
      put(categoryActions.load()),
      put(accountActions.load()),
      put(currencyActions.load()),
      put(balanceActions.total()),
    ];

    while (true) {
      yield new Array(dashboardRequiredData.length).fill(take(dashboardRequiredData));
      break;
    }

    while (true) {
      const auth = yield select((state) => state.auth);

      if (get(auth, 'profile.status') === 'ready') {
        break;
      }

      yield take('AUTH_SET_STATUS_RESOLVED');
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
    yield new Array(initUserActions.length).fill(take(initUserActions));
    break;
  }

  yield put(authActions.setStatus('ready'));
}

function* userTimezoneLocale() {
  if (IS_CLIENT) {
    yield put(authActions.setSettings({
      timezone: -(new Date().getTimezoneOffset()),
      locale: 'auto',
    }));
  }
}

function* onProfile(action) {
  yield put(localeActions.load(get(action, 'payload.data.settings.locale')));
}

function* onSettings(action) {
  yield put(localeActions.load(get(action, 'payload.data.locale')));
  yield put(currencyActions.load());
  yield put(balanceActions.total());
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

function* onLogout() {
  const { currentLocale } = yield select((state) => state.locale);

  yield put(localeActions.load(currentLocale));
}

export default function* () {
  yield fork(onUserReady);

  yield [
    takeLatest(['AUTH_LOGIN_RESOLVED', 'AUTH_REGISTER_RESOLVED'], onAuth),
    takeLatest('AUTH_GET_PROFILE_RESOLVED', onProfile),
    takeLatest('AUTH_SET_SETTINGS_RESOLVED', onSettings),
    takeLatest(['AUTH_LOGOUT_RESOLVED', 'AUTH_REMOVE_PROFILE_RESOLVED'], onLogout),
  ];
}
