import { renderToString } from 'react-dom/server';
import { RouterContext, match } from 'react-router/lib/index';
import { Provider } from 'react-redux';
import { push } from 'react-router-redux';
import { pick } from 'lodash';
import passport from 'koa-passport';
import React from 'react';
import Helmet from 'react-helmet';
import uuid from 'uuid';

import sagas from '../../shared/sagas';
import storeCreator from '../store-creator';
import routes from '../../shared/routes';
import fetcher from '../utils/fetcher';
import HtmlPage from '../components/HtmlPage';
import { authActions, dashboardActions } from '../../shared/actions';

import ClientBundleAssets from '../../../build/client/assets.json';

const chunks = Object.keys(ClientBundleAssets).map(key => ClientBundleAssets[key]);

const assets = chunks.reduce((acc, chunk) => {
  if (chunk.js) {
    acc.javascript.push({ path: chunk.js, key: uuid.v4() });
  }
  if (chunk.css) {
    acc.css.push({ path: chunk.css, key: uuid.v4() });
  }
  return acc;
}, { javascript: [], css: [] });

const runRouter = (location, routes) =>
  new Promise((resolve) =>
    match({ routes, location }, (...args) => resolve(args)));

export default async (ctx, next) => {
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
      store.dispatch(dashboardActions.ready());
    } else {
      store.dispatch(authActions.setSettingsResolved({ locale: ctx.language }));
    }

    let err;
    let redirect;
    let renderProps;

    try {
      [err, redirect, renderProps] = await runRouter(ctx.request.url, routes(store));
    } catch (e) {
      err = e;
    }

    if (redirect) {
      ctx.status = 307;
      ctx.redirect(redirect.pathname);

      return;
    }

    if (err) {
      ctx.log.error(err);

      ctx.status = 500;
      ctx.body = process.env.NODE_ENV === 'development' ? err.stack : err.message;

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

    try {
      await store.runSaga(sagas);
      store.dispatch(push(ctx.request.url));
      await fetcher(store.dispatch, renderProps.components, renderProps.params);

      const layoutProps = {
        initialState: store.getState(),
        body: renderToString(initialView),
        head: Helmet.rewind(),
        assets,
      };

      ctx.body = `<!DOCTYPE html>${renderToString(<HtmlPage {...layoutProps} />)}`;

      Helmet.rewind();
    } catch (err) {
      ctx.log.error(err);

      ctx.body = process.env.NODE_ENV === 'development' ? err.stack : err.message;
      ctx.status = 500;
      store.close();
    }
  })(ctx, next);
};
