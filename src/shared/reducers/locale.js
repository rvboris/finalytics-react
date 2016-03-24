import { handleActions } from 'redux-actions';
import Immutable from 'seamless-immutable';
import { addLocaleData } from 'react-intl';
import en from 'react-intl/locale-data/en';
import ru from 'react-intl/locale-data/ru';

import * as langs from '../lang';
import config from '../config';

addLocaleData(en);
addLocaleData(ru);

const initialState = Immutable({
  messages: langs[config.defaultLang],
});

export default handleActions({
  LOAD: (state, action) => {
    if (langs[action.payload]) {
      return state.set('messages', langs[action.payload]);
    }

    return state;
  },
}, initialState);
