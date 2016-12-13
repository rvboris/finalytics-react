import { get } from 'lodash';
import Immutable from 'seamless-immutable';
import { handleActions } from 'redux-actions';

import config from '../config';

const initialState = Immutable({
  isAuthenticated: false,
  token: null,
  userAgent: null,
  process: false,
  profile: {
    settings: {
      locale: config.defaultLang,
    },
  },
});

export default handleActions({
  AUTH_LOGIN: (state) => state.set('process', true),

  AUTH_LOGIN_RESOLVED: (state) => state.set('process', false),

  AUTH_LOGIN_REJECTED: (state) =>
    state
      .set('process', false)
      .set('profile', initialState.profile),

  AUTH_LOGOUT: (state) => state.set('process', true),

  AUTH_LOGOUT_RESOLVED: (state) =>
    initialState.setIn(
      ['profile', 'settings', 'locale'],
      get(state, 'profile.settings.locale', config.defaultLang)
    ),

  AUTH_LOGOUT_REJECTED: (state) => state.set('process', false),

  AUTH_REGISTER: (state) => state.set('process', true),

  AUTH_REGISTER_RESOLVED: (state) => state.set('process', false),

  AUTH_REGISTER_REJECTED: (state) =>
    state
      .set('process', false)
      .set('profile', initialState.profile),

  AUTH_GET_PROFILE: (state) => state.set('process', true),

  AUTH_GET_PROFILE_RESOLVED: (state, action) =>
    state
      .set('process', false)
      .merge({
        profile: get(action, 'payload.data'),
      }),

  AUTH_GET_PROFILE_REJECTED: (state) => state.set('process', false),

  AUTH_SET_SETTINGS: (state) => state.set('process', true),

  AUTH_SET_SETTINGS_RESOLVED: (state, action) =>
    state
      .set('process', false)
      .merge({
        profile: { settings: get(action, 'payload.data') },
      }, { deep: true }),

  AUTH_SET_SETTINGS_REJECTED: (state) => state.set('process', false),

  AUTH_SET_STATUS: (state) => state.set('process', true),

  AUTH_SET_STATUS_RESOLVED: (state, action) =>
    state
      .set('process', false)
      .setIn(['profile', 'status'], get(action, 'payload.data.status')),

  AUTH_SET_STATUS_REJECTED: (state) => state.set('process', false),

  AUTH_SET_TOKEN: (state, action) =>
    state
      .set('isAuthenticated', true)
      .set('token', get(action, 'payload.token')),

  AUTH_SET_USER_AGENT: (state, action) =>
    state
      .set('userAgent', get(action, 'payload.userAgent')),
}, initialState);
