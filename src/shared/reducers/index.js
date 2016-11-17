import Immutable from 'seamless-immutable';
import { reducer as formReducer } from 'redux-form';

export { default as auth } from './auth';
export { default as locale } from './locale';
export { default as category } from './category';
export { default as account } from './account';
export { default as currency } from './currency';
export { default as operation } from './operation';

export function form(state = Immutable({}), action) {
  return Immutable(formReducer(state, action));
}
