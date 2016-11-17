import Immutable from 'seamless-immutable';
import { handleActions } from 'redux-actions';

const initialState = Immutable({
  process: false,
  list: [],
  total: 0,
  query: {
    limit: 10,
    skip: 0,
  },
});

export default handleActions({
  OPERATION_LIST: (state) => state.set('process', true),

  OPERATION_LIST_RESOLVED: (state, action) => {
    console.log(action);

    return state
      .set('process', false)
      .set('list', state.list.concat(Immutable(action.payload.data.operations)))
      .set('total', action.payload.data.total)
      .merge({ query: action.payload });
  },

  OPERATION_LIST_REJECTED: (state) => state.set('process', false),

  OPERATION_ADD: (state) => state.set('process', true),

  OPERATION_ADD_RESOLVED: (state) => state.set('process', false),

  OPERATION_ADD_REJECTED: (state) => state.set('process', false),
}, initialState);
