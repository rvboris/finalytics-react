import Immutable from 'seamless-immutable';
import { handleActions } from 'redux-actions';
import { assignIn, get } from 'lodash';

const initialState = Immutable({
  process: false,
  list: [],
  total: 0,
  query: {
    limit: 10,
    skip: 0,
    account: null,
    type: null,
    category: null,
    amountFrom: null,
    amountTo: null,
    dateFrom: null,
    dateTo: null,
  },
});

export default handleActions({
  OPERATION_LIST: (state) => state.set('process', true),

  OPERATION_LIST_RESOLVED: (state, action) => {
    const newList = state.list.concat(Immutable(get(action, 'payload.data.operations', [])));
    const lastQuery = assignIn(state.query.asMutable(), get(action, 'payload.config.params', {}));
    const total = get(action, 'payload.data.total', 0);

    return state
      .set('process', false)
      .set('list', newList)
      .set('total', total)
      .merge({ query: lastQuery });
  },

  OPERATION_LIST_REJECTED: (state) => state.set('process', false),

  OPERATION_ADD: (state) => state.set('process', true),

  OPERATION_ADD_RESOLVED: (state) => state.set('process', false),

  OPERATION_ADD_REJECTED: (state) => state.set('process', false),
}, initialState);
