import React from 'react';
import { connect } from 'react-redux';
import { createSelector } from 'reselect';
import { defineMessages, injectIntl, IntlProvider } from 'react-intl';
import { get } from 'lodash';
import Helmet from 'react-helmet';
import moment from 'moment';

import config from '../../config';
import styles from './style.css';

const favicon = require('../../../images/favicon.png');

const messages = defineMessages({
  title: {
    id: 'meta.app.title',
    description: 'Default app title',
    defaultMessage: 'Analyze and save your money',
  },
  description: {
    id: 'meta.app.description',
    description: 'Default app description',
    defaultMessage: 'Simple and light system to control your money',
  },
});

const intlSelector = createSelector(
  state => state.locale.messages,
  messages => ({
    messages,
    defaultLocale: config.defaultLang,
    locale: config.defaultLang,
  })
);

const ConnectedIntlProvider = connect(intlSelector)(IntlProvider);

class App extends React.Component {
  static propTypes = {
    children: React.PropTypes.object.isRequired,
    locale: React.PropTypes.string.isRequired,
    intl: React.PropTypes.object.isRequired,
  };

  constructor(props, context) {
    super(props, context);

    moment.locale(props.locale);
  }

  getMetaTags() {
    const { formatMessage } = this.props.intl;
    const description = formatMessage(messages.description);

    return [
      { name: 'description', content: description },
      { name: 'theme-color', content: '#ffffff' },
    ];
  }

  getLinkTags() {
    return [
      { rel: 'apple-touch-icon', sizes: '180x180', href: favicon },
      { rel: 'icon', type: 'image/png', sizes: '32x32', href: favicon },
      { rel: 'icon', type: 'image/png', sizes: '16x16', href: favicon },
      { rel: 'manifest', href: favicon },
      { rel: 'mask-icon', color: '#5bbad5', href: favicon },
    ];
  }

  render() {
    const { locale, children } = this.props;
    const { formatMessage } = this.props.intl;

    const metaTags = this.getMetaTags();
    const linkTags = this.getLinkTags();

    return (
      <div className={styles.app}>
        <Helmet
          htmlAttributes={{ lang: locale, amp: undefined }}
          titleTemplate="Finalytics - %s"
          title={formatMessage(messages.title)}
          meta={metaTags}
          link={linkTags}
        />
        {children}
      </div>
    );
  }
}

const localeSelector = createSelector(
  state => get(state, 'auth.profile.settings.locale', config.defaultLang),
  locale => locale,
);

const selector = createSelector(
  localeSelector,
  (locale) => ({ locale })
);

const AppIntl = injectIntl(connect(selector)(App));

const AppIntlWrapper = (props) => (
  <ConnectedIntlProvider>
    <AppIntl {...props} />
  </ConnectedIntlProvider>
);

export default AppIntlWrapper;
