import { fork } from 'redux-saga/effects';

import auth from './auth';
import operation from './operation';

export default function* () {
  yield fork(auth);
  yield fork(operation);
}
