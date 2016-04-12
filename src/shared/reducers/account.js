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
}, initialState);
