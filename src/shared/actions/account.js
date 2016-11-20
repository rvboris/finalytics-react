import { createAction } from 'redux-actions';

import config from '../config';

const ACCOUNT_API = `${config.apiUrl}/account`;

export const load = createAction('ACCOUNT_LOAD',
  undefined,
  () => ({
    request: {
      url: `${ACCOUNT_API}/load`,
      method: 'get',
    },
  })
);

export const create = createAction('ACCOUNT_CREATE',
  undefined,
  (values) => ({
    request: {
      url: `${ACCOUNT_API}/add`,
      method: 'post',
      values,
    },
  })
);

export const save = createAction('ACCOUNT_SAVE',
  undefined,
  (values) => ({
    request: {
      url: `${ACCOUNT_API}/update`,
      method: 'post',
      values,
    },
  })
);

export const remove = createAction('ACCOUNT_REMOVE',
  undefined,
  (values) => ({
    request: {
      url: `${ACCOUNT_API}/delete`,
      method: 'post',
      values,
    },
  })
);

export default {
  load,
  create,
  save,
  remove,
};
