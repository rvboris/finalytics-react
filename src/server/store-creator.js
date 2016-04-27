import { createStore, applyMiddleware, compose, combineReducers } from 'redux';
import { routerReducer } from 'react-router-redux';
import { values } from 'lodash';
import Immutable from 'seamless-immutable';
import optimistPromiseMiddleware from 'redux-optimist-promise';
import createSagaMiddleware, { END } from 'redux-saga';

import * as reducers from '../shared/reducers';
import * as middlewares from '../shared/middlewares';

const sagaMiddleware = createSagaMiddleware();

const sagaStoreEnhancer = [
  sagaMiddleware,
  ...values(middlewares),
  optimistPromiseMiddleware(),
];

const storeEnchancers = [
  applyMiddleware(...sagaStoreEnhancer),
];

const reducer = combineReducers(Object.assign({}, reducers, { routing: routerReducer }));

export default () => {
  const store = createStore(reducer, Immutable({}), compose(...storeEnchancers));

  store.runSaga = sagaMiddleware.run;
  store.close = () => store.dispatch(END);

  return store;
};
