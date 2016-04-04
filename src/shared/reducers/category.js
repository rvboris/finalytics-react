import Immutable from 'seamless-immutable';
import { handleActions } from 'redux-actions';

const initialState = Immutable({
  process: false,
  categories: null,
});

export default handleActions({
  LOAD: (state) => state.set('process', true),

  LOAD_RESOLVED: (state, action) =>
    state
      .set('process', false)
      .set('categories', action.payload.data.data)
      .set('_id', action.payload.data._id),

  LOAD_REJECTED: (state) =>
    state
      .set('process', false),
}, initialState);
