import { combineReducers } from 'redux';

export const createRootReducer = reducers => {
  const appReducer = combineReducers(reducers);
  const storeResetActions = [
    'AUTH_REMOVE_PROFILE_RESOLVED',
    'AUTH_LOGOUT_RESOLVED',
  ];

  return (state, action) => {
    if (storeResetActions.includes(action.type)) {
      return appReducer(undefined, action);
    }

    return appReducer(state, action);
  };
};
