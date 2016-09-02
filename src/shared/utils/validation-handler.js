import { has, keys, intersection, last, get } from 'lodash';

const technicalError = { _error: 'global.error.technical' };

export default (values, result) => {
  result = get(result, 'response.data', {});

  if (!result.error) {
    return technicalError;
  }

  const namespace = result.error.split('.');
  const errorFor = intersection(namespace, keys(values));

  if (!errorFor) {
    return technicalError;
  }

  const fieldName = last(errorFor);

  if (has(values, fieldName)) {
    return { [fieldName]: result.error };
  }

  return technicalError;
};
