import { get } from 'lodash';
import Immutable from 'seamless-immutable';
import { handleActions } from 'redux-actions';

const initialState = Immutable({
  total: 0,
  currency: null,
  params: null,
  process: false,
});

export default handleActions({
  BALANCE_TOTAL: (state) => state.set('process', true),

  BALANCE_TOTAL_RESOLVED: (state, action) =>
    state
      .set('process', false)
      .set('total', get(action, 'payload.data.total', 0))
      .set('currency', get(action, 'payload.data.currency', 0))
      .set('params', get(action, 'payload.config.params', {})),

  BALANCE_TOTAL_REJECTED: (state) => state.set('process', true),
}, initialState);
