import React from 'react';
import { connect } from 'react-redux';
import { createSelector } from 'reselect';
import { defineMessages, injectIntl, IntlProvider } from 'react-intl';
import { get } from 'lodash';
import Helmet from 'react-helmet';
import moment from 'moment';

import renderRoutes from '../../utils/render-routes';
import config from '../../config';
import styles from './style.css';

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
  state => get(state, 'locale.currentLocale', config.defaultLocale),
  (messages, locale) => ({
    messages,
    defaultLocale: config.defaultLocale,
    locale,
  })
);

const ConnectedIntlProvider = connect(intlSelector)(IntlProvider);

class App extends React.Component {
  static propTypes = {
    route: React.PropTypes.object.isRequired,
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
    const browserConfig = require('../../../favicons/browserconfig.xml');

    return [
      { name: 'description', content: description },
      { name: 'theme-color', content: '#ffffff' },
      { name: 'msapplication-config', content: browserConfig },
    ];
  }

  getLinkTags() {
    const appleTouch = require('../../../favicons/apple-touch-icon.png');
    const favicon32 = require('../../../favicons/favicon-32x32.png');
    const favicon16 = require('../../../favicons/favicon-16x16.png');
    const safari = require('../../../favicons/safari-pinned-tab.svg');
    const manifest = require('../../../favicons/manifest.json');

    return [
      { rel: 'apple-touch-icon', sizes: '180x180', href: appleTouch },
      { rel: 'icon', type: 'image/png', sizes: '32x32', href: favicon32 },
      { rel: 'icon', type: 'image/png', sizes: '16x16', href: favicon16 },
      { rel: 'manifest', href: manifest },
      { rel: 'mask-icon', color: '#5bbad5', href: safari },
    ];
  }

  render() {
    const { locale, route } = this.props;
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
        {renderRoutes(route.routes)}
      </div>
    );
  }
}

const localeSelector = createSelector(
  state => get(state, 'locale.currentLocale', config.defaultLocale),
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
