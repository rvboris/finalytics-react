import { isFunction, get } from 'lodash';

export default (dispatch, components, params) => {
  const needs = components.reduce((prev, current) => {
    if (current) {
      return (current.needs || get(current, 'WrappedComponent.needs', [])).concat(prev);
    }

    return prev;
  }, []);

  return Promise.all(needs.map(need => {
    if (isFunction(need)) {
      return dispatch(need(params));
    }

    return false;
  }));
};
