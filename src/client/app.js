import 'babel-polyfill';
import React from 'react';
import { render } from 'react-dom';
import { Provider } from 'react-redux';
import { AppContainer } from 'react-hot-loader';
import { browserHistory, match, Router } from 'react-router/lib/index';
import WebFont from 'webfontloader';

import './bootstrap.scss';
import './style.css';

import routes from '../shared/routes';
import { error } from '../shared/log';
import store, { runSaga } from './store';

Promise.config({
  warnings: false,
  longStackTraces: true,
  cancellation: false,
  monitoring: false,
});

const renderApp = () => {
  const matchRouter = { history: browserHistory, routes: routes(store) };

  match(matchRouter, (err, redirectLocation, renderProps) => {
    if (err) {
      error('router match failed');
    }

    render(
      <AppContainer>
        <Provider store={store}>
          <Router {...renderProps} />
        </Provider>
      </AppContainer>,
      document.body.childNodes[0]
    );
  });
};

if (process.env.NODE_ENV === 'development' && module.hot) {
  module.hot.accept();
  module.hot.accept('../shared/routes', renderApp);
}

runSaga();
renderApp();

WebFont.load({
  google: {
    families: ['Noto Sans'],
  },
});
