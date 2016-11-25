import { createAction } from 'redux-actions';

export const ready = createAction('DASHBOARD_READY', undefined);

export default {
  ready,
};
