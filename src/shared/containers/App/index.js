import React from 'react';
import { connect } from 'react-redux';
import { createSelector } from 'reselect';
import { IntlProvider } from 'react-intl';

import config from '../../config';
import styles from './style.css';

const intlSelector = createSelector(
  state => state.locale.messages,
  messages => ({
    messages,
    defaultLocale: config.defaultLang,
    locale: config.defaultLang,
  })
);

const ConnectedIntlProvider = connect(intlSelector)(IntlProvider);

const App = (props) => (
  <ConnectedIntlProvider>
    <div id="app" className={styles.app}>{props.children}</div>
  </ConnectedIntlProvider>
);

App.propTypes = {
  children: React.PropTypes.object.isRequired,
};

export default App;
