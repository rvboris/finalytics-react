import { get } from 'lodash';
import axios from 'axios';

export default store => next => action => {
  const newAction = Object.assign({}, action);

  if (get(newAction, 'meta.request')) {
    const state = store.getState();
    const token = get(state, 'auth.token');

    let req = axios;

    if (token) {
      req = axios.create({ headers: { Authorization: `JWT ${token}` } });
    }

    const method = get(newAction, 'meta.request.method');
    const url = get(newAction, 'meta.request.url');
    const values = get(newAction, 'meta.request.values');

    if (req[method]) {
      const params = method === 'get' ? { params: values } : values;

      newAction.meta.promise = new Promise((...args) => req[method](url, params).then(...args));
      newAction.meta.optimist = true;

      delete newAction.meta.request;
    }
  }

  return next(newAction);
};
