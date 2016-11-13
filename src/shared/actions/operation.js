import { createAction } from 'redux-actions';

import config from '../config';

const OPERATION_API = `${config.apiUrl}/operation`;

export const add = createAction('OPERATION_ADD',
  null,
  (values) => ({
    request: {
      url: `${OPERATION_API}/add`,
      method: 'post',
      values,
    },
  })
);

export const remove = createAction('OPERATION_REMOVE',
  null,
  (values) => ({
    request: {
      url: `${OPERATION_API}/delete`,
      method: 'post',
      values,
    },
  })
);

export const update = createAction('OPERATION_UPDATE',
  null,
  (values) => ({
    request: {
      url: `${OPERATION_API}/update`,
      method: 'post',
      values,
    },
  })
);

export const addTransfer = createAction('OPERATION_ADD_TRANSFER',
  null,
  (values) => ({
    request: {
      url: `${OPERATION_API}/addTransfer`,
      method: 'post',
      values,
    },
  })
);

export const updateTransfer = createAction('OPERATION_UPDATE_TRANSFER',
  null,
  (values) => ({
    request: {
      url: `${OPERATION_API}/updateTransfer`,
      method: 'post',
      values,
    },
  })
);

export const list = createAction('OPERATION_LIST',
  null,
  () => ({
    request: {
      url: `${OPERATION_API}/list`,
      method: 'get',
    },
  })
);

export default {
  add,
  remove,
  update,
  addTransfer,
  updateTransfer,
  list,
};
