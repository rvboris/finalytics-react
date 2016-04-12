import { createAction } from 'redux-actions';

import config from '../config';

const ACCOUNT_API = `${config.apiUrl}/account`;

export const load = createAction('ACCOUNT_LOAD',
  null,
  () => ({
    request: {
      url: `${ACCOUNT_API}/load`,
      method: 'get',
    },
  })
);

export default {
  load,
};
