import { createAction } from 'redux-actions';

import config from '../config';

const CATEGORY_API = `${config.apiUrl}/category`;

export const load = createAction('LOAD',
  null,
  (init = false) => ({
    request: {
      url: `${CATEGORY_API}/load`,
      method: 'post',
      values: { init },
    },
  })
);

export default {
  load,
};
