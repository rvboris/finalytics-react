import { createStore, applyMiddleware, compose, combineReducers } from 'redux';
import { syncHistoryWithStore, routerReducer, routerMiddleware } from 'react-router-redux';
import { browserHistory } from 'react-router';
import { values } from 'lodash';
import optimistPromiseMiddleware from 'redux-optimist-promise';
import Immutable from 'seamless-immutable';
import createSagaMiddleware from 'redux-saga';

import sagas from '../shared/sagas';
import * as reducers from '../shared/reducers';
import * as middlewares from '../shared/middlewares';

const initialState = Immutable(window.INITIAL_STATE);
const reducer = combineReducers({ ...reducers, routing: routerReducer });

const sagaMiddleware = createSagaMiddleware();

const sagaStoreEnhancer = [
  sagaMiddleware,
  routerMiddleware(browserHistory),
  ...values(middlewares),
  optimistPromiseMiddleware(),
];

const storeEnchancers = [
  applyMiddleware(...sagaStoreEnhancer),
];

if (process.env.NODE_ENV === 'development') {
  storeEnchancers.push(window.devToolsExtension ? window.devToolsExtension() : f => f);
}

const store = createStore(reducer, initialState, compose(...storeEnchancers));

if (process.env.NODE_ENV === 'development' && module.hot) {
  module.hot.accept('../shared/reducers', () => store.replaceReducer(reducers.default));
}

export default store;
export const history = syncHistoryWithStore(browserHistory, store);
export const runSaga = () => sagaMiddleware.run(sagas);
