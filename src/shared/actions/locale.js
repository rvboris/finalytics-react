import { createAction } from 'redux-actions';

export const load = createAction('LOCALE_LOAD', (lang) => lang);

export default {
  load,
};
