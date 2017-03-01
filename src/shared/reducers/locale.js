import { handleActions } from 'redux-actions';
import Immutable from 'seamless-immutable';
import { addLocaleData } from 'react-intl';
import moment from 'moment';
import { get } from 'lodash';

import config from '../config';

const initialState = Immutable({
  process: false,
  messages: null,
  availableLocales: config.availableLocales,
  currentLocale: config.defaultLocale,
});

export default handleActions({
  LOCALE_LOAD: (state) => state.set('process', true),

  LOCALE_LOAD_RESOLVED: (state, action) => {
    const locale = action.meta.payload;
    const localeData = get(action, 'payload.0.default');
    const intlLocaleData = get(action, 'payload.1');

    if (!localeData || !intlLocaleData) {
      return state.set('process', false);
    }

    addLocaleData(intlLocaleData);
    moment.locale(action.meta.payload);

    return state
      .set('currentLocale', locale)
      .set('messages', localeData)
      .set('process', false);
  },

  LOCALE_LOAD_REJECTED: () => initialState,
}, initialState);
