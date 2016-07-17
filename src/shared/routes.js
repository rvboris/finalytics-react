import React from 'react';
import { Route, IndexRoute } from 'react-router';
import App from './containers/App';
import { error } from './log';

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

const handleError = (err) => {
  error('Error occurred loading dynamic route');
  error(err);
};

const resolveHomePage = (nextState, cb) => {
  System.import('./containers/HomePage')
    .then(module => cb(null, module.default))
    .catch(handleError);
};

const resolveLoginPage = (nextState, cb) => {
  System.import('./containers/LoginPage')
    .then(module => cb(null, module.default))
    .catch(handleError);
};

const resolveLogoutPage = (nextState, cb) => {
  System.import('./containers/LogoutPage')
    .then(module => cb(null, module.default))
    .catch(handleError);
};

const resolveRegisterPage = (nextState, cb) => {
  System.import('./containers/RegisterPage')
    .then(module => cb(null, module.default))
    .catch(handleError);
};

const resolveDashboardPage = (nextState, cb) => {
  System.import('./containers/DashboardPage')
    .then(module => cb(null, module.default))
    .catch(handleError);
};

export default (store) => (
  <Route name="app" component={App} path="/">
    <IndexRoute getComponent={resolveHomePage} />
    <Route
      path="login"
      getComponent={resolveLoginPage}
      onEnter={requireGuest(store)}
    />
    <Route
      path="logout"
      getComponent={resolveLogoutPage}
      onEnter={requireAuth(store)}
    />
    <Route
      path="register"
      getComponent={resolveRegisterPage}
      onEnter={requireGuest(store)}
    />
    <Route
      path="dashboard"
      getComponent={resolveDashboardPage}
      onEnter={requireAuth(store)}
    />
  </Route>
);
