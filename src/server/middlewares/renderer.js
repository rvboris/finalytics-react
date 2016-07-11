import { renderToString } from 'react-dom/server';
import { RouterContext, match } from 'react-router';
import { Provider } from 'react-redux';
import { push } from 'react-router-redux';
import { pick, values } from 'lodash';
import passport from 'koa-passport';
import React from 'react';

import * as sagas from '../../shared/sagas';
import storeCreator from '../store-creator';
import routes from '../../shared/routes';
import fetcher from '../utils/fetcher';
import ServerLayout from '../components/ServerLayout';
import { authActions } from '../../shared/actions';

import ClientBundleAssets from '../../../build/client/assets.json';

const chunks = Object.keys(ClientBundleAssets).map(key => ClientBundleAssets[key]);

const assets = chunks.reduce((acc, chunk) => {
  if (chunk.js) {
    acc.javascript.push(chunk.js);
  }
  if (chunk.css) {
    acc.css.push(chunk.css);
  }
  return acc;
}, { javascript: [], css: [] });

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

    await store.runSaga(...values(sagas));

    store.dispatch(push(ctx.request.url));

    await fetcher(store.dispatch, renderProps.components, renderProps.params);

    const state = store.getState();

    const layoutProps = {
      initialState: state,
      body: renderToString(initialView),
      locale: ctx.language,
      title: 'koa-universal-react-redux',
      description: 'koa-universal-react-redux',
      assets,
    };

    ctx.body = `<!DOCTYPE html>${renderToString(<ServerLayout {...layoutProps} />)}`;

    store.close();
  })(ctx, next);
};
