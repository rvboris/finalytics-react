import { get } from 'lodash';
import Immutable from 'seamless-immutable';
import { handleActions } from 'redux-actions';

const initialState = Immutable({
  process: false,
  accounts: null,
});

const preReducer = (state) => state.set('process', true);

const reducer = (state, action) =>
  state
    .set('process', false)
    .set('accounts', get(action, 'payload.data.accounts', []));

const postReducer = (state) => state.set('process', false);

export default handleActions({
  ACCOUNT_LOAD: preReducer,

  ACCOUNT_LOAD_RESOLVED: reducer,

  ACCOUNT_LOAD_REJECTED: () => initialState,

  ACCOUNT_CREATE: preReducer,

  ACCOUNT_CREATE_RESOLVED: reducer,

  ACCOUNT_CREATE_REJECTED: postReducer,

  ACCOUNT_SAVE: preReducer,

  ACCOUNT_SAVE_RESOLVED: reducer,

  ACCOUNT_SAVE_REJECTED: postReducer,

  ACCOUNT_REMOVE: preReducer,

  ACCOUNT_REMOVE_RESOLVED: reducer,

  ACCOUNT_REMOVE_REJECTED: postReducer,
}, initialState);
