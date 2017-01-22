import React from 'react';
import { Route, IndexRoute, IndexRedirect } from 'react-router/lib/index';
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

  replace({ pathname: '/dashboard/operations' });
};

const handleError = (err) => {
  error('Error occurred loading dynamic route');
  error(err);
};

const loadRoute = (cb) => (module) => cb(null, module.default);

const resolveHomeRoute = (nextState, cb) => {
  System.import('./containers/Home').then(loadRoute(cb)).catch(handleError);
};

const resolveLoginRoute = (nextState, cb) => {
  System.import('./containers/Login').then(loadRoute(cb)).catch(handleError);
};

const resolveLogoutRoute = (nextState, cb) => {
  System.import('./containers/Logout').then(loadRoute(cb)).catch(handleError);
};

const resolveRegisterRoute = (nextState, cb) => {
  System.import('./containers/Register').then(loadRoute(cb)).catch(handleError);
};

const resolveDashboardRoute = (nextState, cb) => {
  System.import('./containers/Dashboard').then(loadRoute(cb)).catch(handleError);
};

const resolveOperationsRoute = (nextState, cb) => {
  System.import('./containers/Operations').then(loadRoute(cb)).catch(handleError);
};

const resolveAccountsRoute = (nextState, cb) => {
  System.import('./containers/Accounts').then(loadRoute(cb)).catch(handleError);
};

const resolveCategoriesRoute = (nextState, cb) => {
  System.import('./containers/Categories').then(loadRoute(cb)).catch(handleError);
};

export default (store) => (
  <Route name="app" component={App} path="/">
    <IndexRoute getComponent={resolveHomeRoute} />
    <Route
      path="dashboard"
      getComponent={resolveDashboardRoute}
      onEnter={requireAuth(store)}
    >
      <IndexRedirect to="operations" />
      <Route
        path="operations"
        getComponent={resolveOperationsRoute}
      />
      <Route
        path="accounts(/:accountId)"
        getComponent={resolveAccountsRoute}
      />
      <Route
        path="categories(/:categoryId)"
        getComponent={resolveCategoriesRoute}
      />
    </Route>
    <Route
      path="login"
      getComponent={resolveLoginRoute}
      onEnter={requireGuest(store)}
    />
    <Route
      path="logout"
      getComponent={resolveLogoutRoute}
      onEnter={requireAuth(store)}
    />
    <Route
      path="register"
      getComponent={resolveRegisterRoute}
      onEnter={requireGuest(store)}
    />
  </Route>
);
