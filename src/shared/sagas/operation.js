import { takeLatest } from 'redux-saga';
import { put, select } from 'redux-saga/effects';
import { operationActions, accountActions } from '../actions';
import { defaultQuery } from '../reducers/operation';

function* onOperationListChange() {
  const batchMode = yield select((state) => state.operation.batch);

  if (batchMode) {
    return;
  }

  yield [
    put(operationActions.list(defaultQuery)),
    put(accountActions.load()),
  ];

  yield put(operationActions.needUpdate());
}

export default function* () {
  yield takeLatest([
    'OPERATION_ADD_RESOLVED',
    'OPERATION_ADD_TRANSFER_RESOLVED',
    'OPERATION_UPDATE_RESOLVED',
    'OPERATION_UPDATE_TRANSFER_RESOLVED',
    'OPERATION_REMOVE_RESOLVED',
  ], onOperationListChange);
}
