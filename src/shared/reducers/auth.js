import Immutable from 'seamless-immutable';
import { handleActions } from 'redux-actions';

const initialState = Immutable({
  isAuthenticated: false,
  token: null,
  userAgent: null,
  process: false,
  profile: {
    settings: {
      locale: 'ru',
      timezone: 'Europe/Moscow',
    },
  },
});

export default handleActions({
  LOGIN: (state) => state.set('process', true),

  LOGIN_RESOLVED: (state) => state.set('process', false),

  LOGIN_REJECTED: (state) =>
    state
      .set('process', false)
      .set('profile', initialState.profile),

  REGISTER: (state) => state.set('process', true),

  REGISTER_RESOLVED: (state) => state.set('process', false),

  REGISTER_REJECTED: (state) =>
    state
      .set('process', false)
      .set('profile', initialState.profile),

  GET_PROFILE: (state) => state.set('process', true),

  GET_PROFILE_RESOLVED: (state, action) =>
    state
      .set('process', false)
      .set('profile', action.payload.data),

  GET_PROFILE_REJECTED: (state) => state.set('process', false),

  LOGOUT: (state) => state.set('process', true),

  LOGOUT_RESOLVED: () => initialState,

  LOGOUT_REJECTED: (state) => state.set('process', false),

  SET_TOKEN: (state, action) =>
    state
      .set('isAuthenticated', true)
      .set('token', action.payload.token),

  SET_USER_AGENT: (state, action) =>
    state
      .set('userAgent', action.payload.userAgent),
}, initialState);
