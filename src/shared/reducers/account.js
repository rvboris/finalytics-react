import Immutable from 'seamless-immutable';
import { handleActions } from 'redux-actions';

const initialState = Immutable({
  process: false,
  accounts: null,
});

export default handleActions({
  ACCOUNT_LOAD: (state) => state.set('process', true),

  ACCOUNT_LOAD_RESOLVED: (state, action) =>
    state
      .set('process', false)
      .set('accounts', action.payload.data.accounts),

  ACCOUNT_LOAD_REJECTED: () => initialState,

  ACCOUNT_CREATE: (state) => state.set('process', true),

  ACCOUNT_CREATE_RESOLVED: (state, action) =>
    state
      .set('process', false)
      .set('accounts', action.payload.data.accounts),

  ACCOUNT_CREATE_REJECTED: (state) =>
    state
      .set('process', false),

  ACCOUNT_SAVE: (state) => state.set('process', true),

  ACCOUNT_SAVE_RESOLVED: (state, action) =>
    state
      .set('process', false)
      .set('accounts', action.payload.data.accounts),

  ACCOUNT_SAVE_REJECTED: (state) =>
    state
      .set('process', false),

  ACCOUNT_REMOVE: (state) => state.set('process', true),

  ACCOUNT_REMOVE_RESOLVED: (state, action) =>
    state
      .set('process', false)
      .set('accounts', action.payload.data.accounts),

  ACCOUNT_REMOVE_REJECTED: (state) =>
    state
      .set('process', false),
}, initialState);
