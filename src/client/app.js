import React from 'react';
import { render } from 'react-dom';
import { Router } from 'react-router';
import { Provider } from 'react-redux';
import routes from '../shared/routes';
import store, { history } from './store';

render(
  <Provider store={ store }>
      <Router children={ routes(store) } history={ history } />
  </Provider>,
  document.body.childNodes[0]
);

if (__DEVELOPMENT__) {
  const DevTools = require('../shared/containers/DevTools').default;

  let debugElm = document.getElementById('debug');

  if (!debugElm) {
    debugElm = document.createElement('div');
    document.body.appendChild(debugElm);
  }

  render(<DevTools store={store} />, debugElm);
}
