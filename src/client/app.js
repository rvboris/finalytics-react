import React from 'react';
import { render } from 'react-dom';
import { Router } from 'react-router';
import { Provider } from 'react-redux';

import routes from '../shared/routes';
import store, { history, runSaga } from './store';

runSaga();

render(
  <Provider store={store}>
    <Router children={routes(store)} history={history} />
  </Provider>,
  document.body.childNodes[0]
);
