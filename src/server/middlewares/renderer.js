import { renderToString } from 'react-dom/server';
import { RouterContext, match } from 'react-router';
import { Provider } from 'react-redux';
import { push } from 'react-router-redux';
import { pick } from 'lodash';
import createLocation from 'history/lib/createLocation';
import passport from 'koa-passport';
import React from 'react';

import { error } from '../../shared/log';
import storeCreator from '../store-creator';
import routes from '../../shared/routes';
import fetcher from '../utils/fetcher';
import ServerLayout from '../components/ServerLayout';
import { authActions } from '../../shared/actions';

const runRouter = (location, routes) =>
  new Promise((resolve) =>
    match({ routes, location }, (...args) => resolve(args)));

export default async(ctx, next) => {
  if (ctx.request.url.startsWith('/api')) {
    await next();
    return;
  }

  await passport.authenticate('jwt', async (user) => {
    const { token } = ctx.session;

    if (token && !user) {
      ctx.status = 403;
      ctx.session = null;
      ctx.redirect('/login');

      return;
    }

    const store = storeCreator();

    const userAgent = ctx.request.headers['user-agent'];

    if (userAgent) {
      store.dispatch(authActions.setUserAgent(userAgent));
    }

    if (token && user) {
      store.dispatch(authActions.setToken(token));
      store.dispatch(authActions.getProfileResolved(pick(user, ['email', 'settings', 'status'])));
    } else {
      store.dispatch(authActions.setSettingsResolved({ locale: ctx.language }));
    }

    const location = createLocation(ctx.request.url);

    let err;
    let redirect;
    let renderProps;

    try {
      [err, redirect, renderProps] = await runRouter(location, routes(store));
    } catch (e) {
      err = e;
    }

    if (redirect) {
      ctx.status = 307;
      ctx.redirect(redirect.pathname);

      return;
    }

    if (err) {
      error(err);

      ctx.status = 500;
      ctx.body = __DEVELOPMENT__ ? err.stack : err.message;

      return;
    }

    if (!renderProps) {
      ctx.status = 404;

      return;
    }

    const initialView = (
      <Provider store={store}>
        <RouterContext {...renderProps} />
      </Provider>
    );

    store.dispatch(push(ctx.request.url));

    await fetcher(store.dispatch, renderProps.components, renderProps.params);

    const state = store.getState();

    const layoutProps = {
      initialState: state,
      body: renderToString(initialView),
      locale: ctx.language,
      title: 'koa-universal-react-redux',
      description: 'koa-universal-react-redux',
      assets: __ASSETS__,
    };

    ctx.body = `<!DOCTYPE html>${renderToString(<ServerLayout { ...layoutProps } />)}`;
  })(ctx, next);
};
