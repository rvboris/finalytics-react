import Immutable from 'seamless-immutable';
import { handleActions } from 'redux-actions';

const initialState = Immutable({
  ready: false,
});

export default handleActions({
  DASHBOARD_READY: (state) => state.set('ready', true),
}, initialState);
