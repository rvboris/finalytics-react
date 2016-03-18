import { has, keys, intersection, last } from 'lodash';

const technicalError = (fields) => fields.map((field) => ({
  [field]: 'global.error.technical',
  _error: 'global.error.technical',
}));

export default (values, result) => {
  result = result.data || result;

  if (!result.error) {
    return technicalError(keys(values));
  }

  const namespace = result.error.split('.');
  const errorFor = intersection(namespace, keys(values));

  if (!errorFor) {
    return technicalError(keys(values));
  }

  const fieldName = last(errorFor);

  if (has(values, fieldName)) {
    return { [fieldName]: result.error };
  }

  return technicalError(keys(values));
};
