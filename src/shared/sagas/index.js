import { fork } from 'redux-saga/effects';

import auth from './auth';
import operation from './operation';
import balance from './balance';

export default function* () {
  yield fork(auth);
  yield fork(operation);
  yield fork(balance);
}
