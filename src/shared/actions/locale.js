import { createAction } from 'redux-actions';

export const load = createAction('LOAD', (lang) => lang);

export default {
  load,
};
