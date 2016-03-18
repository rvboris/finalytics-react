import { isFunction } from 'lodash';

export default (dispatch, components, params) => {
  const needs = components.reduce((prev, current) =>
    current ? (current.needs || []).concat(prev) : prev, []);

  return Promise.all(needs.map(need => isFunction(need) ? dispatch(need(params)) : false));
};
