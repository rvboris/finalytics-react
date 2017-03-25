import { createStore, applyMiddleware, compose } from 'redux';
import { routerReducer, routerMiddleware } from 'react-router-redux';
import createHistory from 'history/createBrowserHistory';
import { values, get } from 'lodash';
import Immutable from 'seamless-immutable';
import createSagaMiddleware from 'redux-saga';

import sagas from '../shared/sagas';
import * as reducers from '../shared/reducers';
import { createRootReducer } from '../shared/reducers/root';
import * as middlewares from '../shared/middlewares';
import config from '../shared/config';

const initialState = Immutable(window.INITIAL_STATE);
const reducer = createRootReducer({ ...reducers, routing: routerReducer });

const sagaMiddleware = createSagaMiddleware();

export const history = createHistory();

const sagaStoreEnhancer = [
  sagaMiddleware,
  routerMiddleware(history),
  ...values(middlewares),
];

const storeEnchancers = [
  applyMiddleware(...sagaStoreEnhancer),
];

if (process.env.NODE_ENV === 'development' && window.devToolsExtension) {
  storeEnchancers.push(window.devToolsExtension());
}

const store = createStore(reducer, initialState, compose(...storeEnchancers));

if (process.env.NODE_ENV === 'development' && module.hot) {
  module.hot.accept('../shared/reducers', () => {
    const nextRootReducer = require('../shared/reducers/index');
    store.replaceReducer(createRootReducer({ ...nextRootReducer, routing: routerReducer }));
  });
}

export default store;
export const initialLocale = get(initialState, 'locale.currentLocale', config.defaultLocale);
export const runSaga = () => sagaMiddleware.run(sagas);
