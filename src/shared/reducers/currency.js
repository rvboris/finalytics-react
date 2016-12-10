import { get } from 'lodash';
import { handleActions } from 'redux-actions';
import Immutable from 'seamless-immutable';

const initialState = Immutable({
  process: false,
  currencyList: null,
});

export default handleActions({
  CURRENCY_LOAD: (state) => state.set('process', true),

  CURRENCY_LOAD_RESOLVED: (state, action) =>
    state
      .set('process', false)
      .set('currencyList', get(action, 'payload.data.currencyList', null)),

  CATEGORY_LOAD_REJECTED: () => initialState,
}, initialState);
