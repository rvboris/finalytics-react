import { spawn } from 'redux-saga/effects';

import auth from './auth';
import operation from './operation';
import balance from './balance';

export default function* () {
  yield spawn(auth);
  yield spawn(operation);
  yield spawn(balance);
}
