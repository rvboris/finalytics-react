import { get } from 'lodash';
import axios from 'axios';

export default store => next => action => {
  if (get(action, 'meta.request')) {
    const state = store.getState();
    const token = get(state, 'auth.token');

    let req = axios;

    if (token) {
      req = axios.create({ headers: { Authorization: `JWT ${token}` } });
    }

    const method = get(action, 'meta.request.method');
    const url = get(action, 'meta.request.url');
    const values = get(action, 'meta.request.values');

    if (req[method]) {
      action.meta.promise = req[method](url, values);
      action.meta.optimist = true;

      delete action.meta.request;
    }
  }

  return next(action);
};
