import { has, keys, intersection, last, get } from 'lodash';

const technicalError = { _error: 'global.error.technical' };

export default (values, result) => {
  const rs = get(result, 'response.data', {});

  if (!rs.error) {
    return technicalError;
  }

  const namespace = rs.error.split('.');
  const errorFor = intersection(namespace, keys(values));

  if (!errorFor) {
    return technicalError;
  }

  const fieldName = last(errorFor);

  if (has(values, fieldName)) {
    return { [fieldName]: rs.error };
  }

  return technicalError;
};
