import React from 'react';
import { Route, IndexRoute } from 'react-router';

import App from './containers/App';
import Home from './containers/HomePage';
import LoginPage from './containers/LoginPage';
import LogoutPage from './containers/LogoutPage';
import DashboardPage from './containers/DashboardPage';
import RegisterPage from './containers/RegisterPage';

const requireAuth = (store) => (nextState, replace) => {
  const auth = store.getState().auth;

  if (auth.isAuthenticated) {
    return;
  }

  replace({
    pathname: '/login',
    state: { nextPathname: nextState.location.pathname },
  });
};

const requireGuest = (store) => (nextState, replace) => {
  const auth = store.getState().auth;

  if (!auth.isAuthenticated) {
    return;
  }

  replace({ pathname: '/dashboard' });
};

export default (store) => (
  <Route name="app" component={ App } path="/">
    <IndexRoute component={ Home } />
    <Route path="login" component={ LoginPage } onEnter={ requireGuest(store) } />
    <Route path="logout" component={ LogoutPage } onEnter={ requireAuth(store) } />
    <Route path="register" component={ RegisterPage } onEnter={ requireGuest(store) } />
    <Route path="dashboard" component={ DashboardPage } onEnter={ requireAuth(store) } />
  </Route>
);
