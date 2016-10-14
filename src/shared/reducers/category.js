import Immutable from 'seamless-immutable';
import { handleActions } from 'redux-actions';

const initialState = Immutable({
  process: false,
  _id: null,
  data: null,
});

const preReducer = (state) => state.set('process', true);

const reducer = (state, action) =>
  state
    .set('process', false)
    .set('data', action.payload.data.data)
    .set('_id', action.payload.data._id);

const postReducer = () => initialState;

export default handleActions({
  CATEGORY_LOAD: preReducer,

  CATEGORY_LOAD_RESOLVED: reducer,

  CATEGORY_LOAD_REJECTED: postReducer,

  CATEGORY_UPDATE: preReducer,

  CATEGORY_UPDATE_RESOLVED: reducer,

  CATEGORY_UPDATE_REJECTED: postReducer,

  CATEGORY_REMOVE: preReducer,

  CATEGORY_REMOVE_RESOLVED: reducer,

  CATEGORY_REMOVE_REJECTED: postReducer,

  CATEGORY_ADD: preReducer,

  CATEGORY_ADD_RESOLVED: reducer,

  CATEGORY_ADD_REJECTED: postReducer,

  CATEGORY_MOVE: preReducer,

  CATEGORY_MOVE_RESOLVED: reducer,

  CATEGORY_MOVE_REJECTED: postReducer,
}, initialState);
