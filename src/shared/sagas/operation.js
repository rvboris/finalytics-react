import { takeLatest } from 'redux-saga';
import { select, put } from 'redux-saga/effects';
import { operationActions, accountActions } from '../actions';

function* onOperationListChange() {
  const query = yield select((state) => state.operation.query);
  yield [put(operationActions.list(query)), put(accountActions.load())];
}

export default function* () {
  yield takeLatest(['OPERATION_ADD_RESOLVED', 'OPERATION_REMOVE_RESOLVED'], onOperationListChange);
}
