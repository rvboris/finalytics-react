import Immutable from 'seamless-immutable';
import { handleActions } from 'redux-actions';

const initialState = Immutable({
  process: false,
  _id: null,
  data: null,
});

export default handleActions({
  CATEGORY_LOAD: (state) => state.set('process', true),

  CATEGORY_LOAD_RESOLVED: (state, action) =>
    state
      .set('process', false)
      .set('data', action.payload.data.data)
      .set('_id', action.payload.data._id),

  CATEGORY_LOAD_REJECTED: () => initialState,
}, initialState);
