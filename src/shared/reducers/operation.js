import Immutable from 'seamless-immutable';
import { handleActions } from 'redux-actions';
import { assignIn, get, omit } from 'lodash';
import deepEqual from 'deep-equal';

export const defaultQuery = {
  limit: 10,
  skip: 0,
  account: null,
  type: null,
  category: null,
  amountFrom: null,
  amountTo: null,
  dateFrom: null,
  dateTo: null,
};

const initialState = Immutable({
  process: false,
  list: [],
  total: 0,
  query: defaultQuery,
  needUpdate: false,
});

const queryIsEqual = (currentQuery, newQuery) => {
  const toOmit = ['limit', 'skip'];
  return deepEqual(omit(currentQuery, toOmit), omit(newQuery, toOmit));
};

export default handleActions({
  OPERATION_LIST: (state) => state.set('process', true),

  OPERATION_LIST_RESOLVED: (state, action) => {
    const currentQuery = state.query.asMutable();
    const newQuery = get(action, 'payload.config.params', {});
    const data = get(action, 'payload.data.operations', []);

    const { needUpdate } = state;
    const isSameLimit = currentQuery.limit === newQuery.limit;
    const isSameSkip = currentQuery.skip === newQuery.skip;
    const isSamePage = isSameLimit && isSameSkip;

    let newList;

    if (!needUpdate && !isSamePage && queryIsEqual(currentQuery, newQuery)) {
      newList = state.list.concat(Immutable(data));
    } else {
      newList = data;
    }

    const lastQuery = assignIn(currentQuery, newQuery);
    const total = get(action, 'payload.data.total', 0);

    return state
      .set('process', false)
      .set('list', newList)
      .set('total', total)
      .set('needUpdate', false)
      .merge({ query: lastQuery });
  },

  OPERATION_LIST_REJECTED: (state) => state.set('process', false),

  OPERATION_ADD: (state) => state.set('process', true),

  OPERATION_ADD_RESOLVED: (state) => state.set('process', false),

  OPERATION_ADD_REJECTED: (state) => state.set('process', false),

  OPERATION_ADD_TRANSFER: (state) => state.set('process', true),

  OPERATION_ADD_TRANSFER_RESOLVED: (state) => state.set('process', false),

  OPERATION_ADD_TRANSFER_REJECTED: (state) => state.set('process', false),

  OPERATION_NEED_UPDATE: (state) => state.set('needUpdate', true),
}, initialState);
