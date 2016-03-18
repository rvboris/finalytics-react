import { createStore, applyMiddleware, compose, combineReducers } from 'redux';
import { syncHistoryWithStore, routerReducer, routerMiddleware } from 'react-router-redux';
import { browserHistory } from 'react-router';
import { values } from 'lodash';
import optimistPromiseMiddleware from 'redux-optimist-promise';
import Immutable from 'seamless-immutable';
import createSagaMiddleware from 'redux-saga';

import * as sagas from '../shared/sagas';
import * as reducers from '../shared/reducers';
import * as middlewares from '../shared/middlewares';

let persistState;
let DevTools;

if (__DEVELOPMENT__) {
  persistState = require('redux-devtools').persistState;
  DevTools = require('../shared/containers/DevTools').default;
}

const initialState = Immutable(window.__INITIAL_STATE__);
const reducer = combineReducers({ ...reducers, routing: routerReducer });

const middleware = [
  ...values(middlewares),
  optimistPromiseMiddleware(),
  routerMiddleware(browserHistory),
  createSagaMiddleware(...values(sagas)),
];

const storeEnchancers = [
  applyMiddleware(...middleware),
];

if (__DEVELOPMENT__) {
  storeEnchancers.push(DevTools.instrument());
  storeEnchancers.push(persistState(window.location.href.match(/[?&]debug_session=([^&]+)\b/)));
}

const store = createStore(reducer, initialState, compose(...storeEnchancers));

if (module.hot) {
  module.hot.accept('../shared/reducers', () => store.replaceReducer(reducers.default));
}


export default store;
export const history = syncHistoryWithStore(browserHistory, store);
