import { createAction } from 'redux-actions';

import config from '../config';

const CATEGORY_API = `${config.apiUrl}/category`;

export const load = createAction(
  'CATEGORY_LOAD',
  undefined,
  () => ({
    request: {
      url: `${CATEGORY_API}/load`,
      method: 'get',
    },
  })
);

export const update = createAction(
  'CATEGORY_UPDATE',
  undefined,
  (values) => ({
    request: {
      url: `${CATEGORY_API}/update`,
      method: 'post',
      values,
    },
  })
);

export const remove = createAction(
  'CATEGORY_REMOVE',
  undefined,
  (values) => ({
    request: {
      url: `${CATEGORY_API}/delete`,
      method: 'post',
      values,
    },
  })
);

export const add = createAction(
  'CATEGORY_ADD',
  undefined,
  (values) => ({
    request: {
      url: `${CATEGORY_API}/add`,
      method: 'post',
      values,
    },
  })
);

export const move = createAction(
  'CATEGORY_MOVE',
  undefined,
  (values) => ({
    request: {
      url: `${CATEGORY_API}/move`,
      method: 'post',
      values,
    },
  })
);

export default {
  load,
  update,
  remove,
  add,
  move,
};
