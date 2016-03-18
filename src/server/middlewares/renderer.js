import { renderToString } from 'react-dom/server';
import { RouterContext, match } from 'react-router';
import { Provider } from 'react-redux';
import { push } from 'react-router-redux';
import createLocation from 'history/lib/createLocation';
import passport from 'koa-passport';
import React from 'react';

import { error } from '../../shared/log';
import storeCreator from '../store-creator';
import routes from '../../shared/routes';
import fetcher from '../utils/fetcher';
import ServerLayout from '../components/ServerLayout';
import { authActions, localeActions } from '../../shared/actions';

const runRouter = (location, routes) =>
  new Promise((resolve) =>
    match({ routes, location }, (...args) => resolve(args)));

const profileResolvedAction = (user) => ({
  type: 'GET_PROFILE_RESOLVED',
  payload: {
    data: {
      email: user.email,
      settings: user.settings,
    },
  },
});

export default async(ctx, next) =>
  passport.authenticate('jwt', async (user) => {
    const token = ctx.cookies.get('jwt');

    if (token && !user) {
      ctx.status = 403;
      ctx.cookies.set('jwt', '');
      ctx.redirect('/login');

      return;
    }

    const store = storeCreator();

    store.dispatch(authActions.setUserAgent(ctx.request.headers['user-agent']));

    if (token && user) {
      store.dispatch(authActions.setToken(token));
      store.dispatch(localeActions.load(user.settings.locale));
      store.dispatch(profileResolvedAction(user));
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
      locale: state.auth.profile.settings.locale,
      title: 'koa-universal-react-redux',
      description: 'koa-universal-react-redux',
      assets: __ASSETS__,
    };

    ctx.body = `<!DOCTYPE html>${renderToString(<ServerLayout { ...layoutProps } />)}`;
  })(ctx, next);
