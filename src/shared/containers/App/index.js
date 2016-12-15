import React from 'react';
import { connect } from 'react-redux';
import { createSelector } from 'reselect';
import { IntlProvider } from 'react-intl';
import Helmet from 'react-helmet';

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
    <div className={styles.app}>
      <Helmet
        title="test"
        titleTemplate="Finalytics - %s"
        defaultTitle="My Default Title"
        meta={[
            { name: 'description', content: 'Helmet application' },
            { property: 'og:type', content: 'article' },
        ]}
        link={[
            { rel: 'apple-touch-icon', href: 'http://mysite.com/img/apple-touch-icon-57x57.png' },
            { rel: 'apple-touch-icon', sizes: '72x72', href: 'http://mysite.com/img/apple-touch-icon-72x72.png' },
        ]}
      />
      {props.children}
    </div>
  </ConnectedIntlProvider>
);

App.propTypes = {
  children: React.PropTypes.object.isRequired,
};

export default App;
