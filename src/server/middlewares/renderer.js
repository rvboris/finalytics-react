import { renderToString } from 'react-dom/server';
import { StaticRouter } from 'react-router-dom';
import { matchRoutes } from 'react-router-config';
import { Provider } from 'react-redux';
import { push } from 'react-router-redux';
import { get } from 'lodash';
import passport from 'koa-passport';
import React from 'react';
import Helmet from 'react-helmet';

import sagas from '../../shared/sagas';
import storeCreator from '../store-creator';
import renderRoutes from '../../shared/utils/render-routes';
import routes from '../../shared/routes';
import fetcher from '../utils/fetcher';
import assets from '../utils/assets';
import HtmlPage from '../components/HtmlPage';
import { authActions, localeActions, dashboardActions } from '../../shared/actions';

export default async (ctx, next) => {
  if (ctx.request.url.startsWith('/api')) {
    await next();
    return;
  }

  await passport.authenticate('jwt', async (authError, user) => {
    const { token } = ctx.session;

    if ((token && !user) || authError) {
      if (authError) {
        ctx.log.error(authError);
      }

      ctx.status = authError ? 500 : 403;
      ctx.session = null;
      ctx.redirect('/login');

      return;
    }

    const store = storeCreator();
    const userAgent = ctx.request.headers['user-agent'];

    if (userAgent) {
      store.dispatch(authActions.setUserAgent(userAgent));
    }

    const isAuthenticated = token && user;

    if (isAuthenticated) {
      const userProfile = user.getProfile();

      store.dispatch(authActions.setToken(token));
      store.dispatch(authActions.getProfileResolved(userProfile));
      store.dispatch(localeActions.load(get(userProfile, 'settings.locale')));
      store.dispatch(dashboardActions.ready());
    } else {
      store.dispatch(authActions.setSettingsResolved({ locale: ctx.locale }));
      store.dispatch(localeActions.load(ctx.locale));
    }

    store.dispatch(push(ctx.request.url));

    let err;

    try {
      const branch = matchRoutes(routes, ctx.request.url);
      await fetcher(store.dispatch, isAuthenticated, branch);
    } catch (e) {
      err = e;
    }

    if (err) {
      ctx.log.error(err);

      ctx.status = 500;
      ctx.body = process.env.NODE_ENV === 'development' ? err.stack : err.message;

      store.close();

      return;
    }

    const routerContext = {};

    const initialView = (
      <Provider store={store}>
        <StaticRouter context={routerContext} location={ctx.request.url}>
          {renderRoutes(routes)}
        </StaticRouter>
      </Provider>
    );

    try {
      await store.runSaga(sagas);

      const initialState = store.getState();
      const body = renderToString(initialView);
      const head = Helmet.rewind();

      if (routerContext.url) {
        ctx.status = routerContext.status;
        ctx.redirect(routerContext.url);
        store.close();

        return;
      }

      const layoutProps = {
        initialState,
        body,
        head,
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
