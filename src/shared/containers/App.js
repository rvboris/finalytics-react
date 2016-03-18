import React from 'react';
import getMuiTheme from 'material-ui/lib/styles/getMuiTheme';
import { createSelector } from 'reselect';
import { connect } from 'react-redux';
import { IntlProvider } from 'react-intl';

import config from '../config';
import styles from './App.css';
import injectTapEventPlugin from 'react-tap-event-plugin';

injectTapEventPlugin();

Promise.config({
  warnings: false,
  longStackTraces: true,
  cancellation: true,
  monitoring: true,
});

const intlSelector = createSelector(state => ({
  messages: state.locale.messages,
  defaultLocale: config.defaultLang,
  locale: config.defaultLang,
}), state => state);

const ConnectedIntlProvider = connect(intlSelector)(IntlProvider);

class App extends React.Component {
  static propTypes = {
    dispatch: React.PropTypes.func.isRequired,
    children: React.PropTypes.object.isRequired,
    auth: React.PropTypes.object.isRequired,
  };

  static childContextTypes = {
    muiTheme: React.PropTypes.object,
  };

  getChildContext() {
    const userAgent = this.props.auth.userAgent;

    return {
      muiTheme: getMuiTheme({ userAgent }),
    };
  }

  render() {
    return (
      <ConnectedIntlProvider>
        <div id="app" className={ styles.app }>{ this.props.children }</div>
      </ConnectedIntlProvider>
    );
  }
}

const selector = createSelector(
  state => state,
  state => state
);

export default connect(selector)(App);
