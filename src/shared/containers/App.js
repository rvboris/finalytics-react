import React from 'react';
import { createSelector } from 'reselect';
import { connect } from 'react-redux';
import { IntlProvider } from 'react-intl';

import config from '../config';
import styles from './App.css';

const intlSelector = createSelector(state => ({
  messages: state.locale.messages,
  defaultLocale: config.defaultLang,
  locale: config.defaultLang,
}), state => state);

const ConnectedIntlProvider = connect(intlSelector)(IntlProvider);

const App = (props) => (
  <ConnectedIntlProvider>
    <div id="app" className={styles.app}>{props.children}</div>
  </ConnectedIntlProvider>
);

App.propTypes = {
  dispatch: React.PropTypes.func.isRequired,
  children: React.PropTypes.object.isRequired,
  auth: React.PropTypes.object.isRequired,
};

const selector = createSelector(
  state => state,
  state => state
);

export default connect(selector)(App);
