import { combineReducers } from 'redux';

export const createRootReducer = reducers => {
  const appReducer = combineReducers(reducers);

  return (state, action) => {
    if (action.type === 'AUTH_LOGOUT_RESOLVED') {
      return appReducer(undefined, action);
    }

    return appReducer(state, action);
  };
};
