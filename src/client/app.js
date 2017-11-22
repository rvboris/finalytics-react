import 'babel-polyfill';
import React from 'react';
import { hydrate } from 'react-dom';
import { Provider } from 'react-redux';
import { AppContainer } from 'react-hot-loader';
import { addLocaleData } from 'react-intl';
import { ConnectedRouter } from 'react-router-redux';
import { renderRoutes } from 'react-router-config';
import WebFont from 'webfontloader';
import moment from 'moment';

import routes from '../shared/routes';

import './bootstrap.scss';
import './style.css';

import store, { runSaga, initialLocale, history } from './store';

Promise.config({
  warnings: false,
  longStackTraces: true,
  cancellation: false,
  monitoring: false,
});

const renderApp = () => {
  hydrate(
    <AppContainer>
      <Provider store={store}>
        <ConnectedRouter history={history}>
          {renderRoutes(routes)}
        </ConnectedRouter>
      </Provider>
    </AppContainer>,
    document.body.childNodes[0]
  );
};

if (process.env.NODE_ENV === 'development' && module.hot) {
  module.hot.accept();
  module.hot.accept('../shared/routes', renderApp);
}

runSaga();

import(`react-intl/locale-data/${initialLocale}`).then((localeData) => {
  addLocaleData(localeData);
  moment.locale(initialLocale);

  renderApp();
});

WebFont.load({
  google: {
    families: ['Noto Sans'],
  },
});
