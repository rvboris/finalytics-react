import { isFunction, get } from 'lodash';

const getNeeds = (component, isAuthenticated) => {
  const needs = component.needs || get(component, 'WrappedComponent.needs', {});
  const userNeeds = isAuthenticated ? needs.user || [] : [];
  const guestNeeds = !isAuthenticated ? needs.guest || [] : [];
  const allNeeds = needs.all || [];

  return [
    ...userNeeds,
    ...guestNeeds,
    ...allNeeds,
  ];
};

export default (dispatch, isAuthenticated, branch) => {
  const promises = branch.reduce((prev, { route: { component } }) => {
    if (!component) {
      return prev;
    }

    return getNeeds(component, isAuthenticated).concat(prev);
  });

  return Promise.all(promises.map(need => {
    if (isFunction(need)) {
      return dispatch(need());
    }

    return false;
  }));
};
