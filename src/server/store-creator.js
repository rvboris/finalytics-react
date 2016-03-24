import { createStore, applyMiddleware, compose, combineReducers } from 'redux';
import { routerReducer } from 'react-router-redux';
import { values } from 'lodash';
import Immutable from 'seamless-immutable';
import optimistPromiseMiddleware from 'redux-optimist-promise';
import createSagaMiddleware from 'redux-saga';

import * as sagas from '../shared/sagas';
import * as reducers from '../shared/reducers';
import * as middlewares from '../shared/middlewares';

const middleware = [
  ...values(middlewares),
  optimistPromiseMiddleware(),
  createSagaMiddleware(...values(sagas)),
];

const storeEnchancers = [
  applyMiddleware(...middleware),
];

const reducer = combineReducers(Object.assign({}, reducers, { routing: routerReducer }));

export default () => createStore(reducer, Immutable({}), compose(...storeEnchancers));
