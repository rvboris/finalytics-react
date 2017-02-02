import { put, takeLatest } from 'redux-saga/effects';
import { balanceActions } from '../actions';

function* onAccountChange() {
  if (IS_CLIENT) {
    yield put(balanceActions.total());
  }
}

export default function* () {
  yield takeLatest([
    'ACCOUNT_LOAD_RESOLVED',
    'ACCOUNT_CREATE_RESOLVED',
    'ACCOUNT_SAVE_RESOLVED',
    'ACCOUNT_REMOVE_RESOLVED',
  ], onAccountChange);
}
