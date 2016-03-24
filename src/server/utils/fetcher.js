import { isFunction } from 'lodash';

export default (dispatch, components, params) => {
  const needs = components.reduce((prev, current) => {
    if (current) {
      return (current.needs || []).concat(prev);
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
