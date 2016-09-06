import { createAction } from 'redux-actions';

import config from '../config';

const CURRENCY_API = `${config.apiUrl}/currency`;

export const load = createAction('CURRENCY_LOAD',
  null,
  () => ({
    request: {
      url: `${CURRENCY_API}/load`,
      method: 'get',
    },
  })
);

export default {
  load,
};
