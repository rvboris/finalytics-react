import React from 'react';
import { connect } from 'react-redux';
import { createSelector } from 'reselect';
import { get } from 'lodash';
import { defineMessages, FormattedMessage, injectIntl } from 'react-intl';
import moment from 'moment';

import style from './style.css';
import config from '../../config';
import { accountActions, categoryActions, currencyActions } from '../../actions';
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
  static needs = [
    accountActions.load,
    categoryActions.load,
    currencyActions.load,
  ];

  static propTypes = {
    children: React.PropTypes.object.isRequired,
    isReady: React.PropTypes.bool.isRequired,
    locale: React.PropTypes.string.isRequired,
  }

  constructor(props, context) {
    super(props, context);

    moment.locale(props.locale);
  }

  render() {
    const { isReady, children } = this.props;

    if (!isReady) {
      return (
        <div className={style.spinner}>
          <Spinner />
          <h4 className="mt-1"><FormattedMessage {...messages.loading} /></h4>
        </div>
      );
    }

    return (
      <div className="pt-1">
        <div className="container"><AppBar /></div>
        <div className="container mt-1">{ children }</div>
      </div>
    );
  }
}

const localeSelector = createSelector(
  state => get(state, 'auth.profile.settings.locale', config.defaultLang),
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
