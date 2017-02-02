import { createAction } from 'redux-actions';

import config from '../config';

const OPERATION_API = `${config.apiUrl}/balance`;

export const total = createAction('BALANCE_TOTAL',
  undefined,
  (values) => ({
    request: {
      url: `${OPERATION_API}/total`,
      method: 'get',
      values,
    },
  })
);

export default {
  total,
};
