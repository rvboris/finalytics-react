import { createAction } from 'redux-actions';

export const load = createAction('LOCALE_LOAD',
  undefined,
  (locale) => ({
    promise: Promise.all([
      import(`../locale/${locale}`),
      import(`react-intl/locale-data/${locale}`),
    ]),
    optimist: true,
  })
);

export default {
  load,
};
