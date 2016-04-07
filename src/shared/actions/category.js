import { createAction } from 'redux-actions';

import config from '../config';

const CATEGORY_API = `${config.apiUrl}/category`;

export const load = createAction('LOAD',
  null,
  () => ({
    request: {
      url: `${CATEGORY_API}/load`,
      method: 'get',
    },
  })
);

export default {
  load,
};
