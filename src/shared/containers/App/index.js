import React from 'react';
import { connect } from 'react-redux';
import { createSelector } from 'reselect';
import { IntlProvider } from 'react-intl';
import classnames from 'classnames';

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
    <div id="app" className={classnames(styles.app, 'pt-1')}>{props.children}</div>
  </ConnectedIntlProvider>
);

App.propTypes = {
  children: React.PropTypes.object.isRequired,
};

export default App;
