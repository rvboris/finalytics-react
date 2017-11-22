import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';
import { createSelector } from 'reselect';
import { get } from 'lodash';
import { defineMessages, FormattedMessage, injectIntl } from 'react-intl';
import moment from 'moment';

import renderRoutes from '../../utils/render-routes';
import style from './style.css';
import config from '../../config';
import { accountActions, categoryActions, currencyActions, balanceActions } from '../../actions';
import AppBar from '../../components/AppBar';
import Spinner from '../../components/Spinner';

const messages = defineMessages({
  loading: {
    id: 'container.dashboard.loading',
    description: 'Loading process text',
    defaultMessage: 'Loading, please wait...',
  },
});

class Dashboard extends React.Component {
  static needs = {
    user: [
      accountActions.load,
      categoryActions.load,
      currencyActions.load,
      balanceActions.total,
    ],
  }

  static propTypes = {
    route: PropTypes.object.isRequired,
    isReady: PropTypes.bool.isRequired,
    locale: PropTypes.string.isRequired,
  }

  constructor(props, context) {
    super(props, context);

    moment.locale(props.locale);
  }

  render() {
    const { isReady, route } = this.props;

    if (!isReady) {
      return (
        <div className={style.spinner}>
          <Spinner />
          <h4 className="mt-3"><FormattedMessage {...messages.loading} /></h4>
        </div>
      );
    }

    return (
      <div className="pt-3">
        <div className="container"><AppBar /></div>
        <div className="container mt-3">{renderRoutes(route.routes)}</div>
      </div>
    );
  }
}

const localeSelector = createSelector(
  state => get(state, 'locale.currentLocale', config.defaultLocale),
  locale => locale,
);

const isReadySelector = createSelector(
  state => get(state, 'dashboard.ready', false),
  ready => ready,
);

const selector = createSelector(
  isReadySelector,
  localeSelector,
  (isReady, locale) => ({ isReady, locale })
);

export default injectIntl(connect(selector)(Dashboard));
