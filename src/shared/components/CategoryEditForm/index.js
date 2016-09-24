import React from 'react';
import { connect } from 'react-redux';
import { get, isUndefined } from 'lodash';
import { createSelector } from 'reselect';
import { push } from 'react-router-redux';
import { reduxForm } from 'redux-form';
import { injectIntl } from 'react-intl';
import TreeModel from 'tree-model';

class CategoryEditForm extends React.Component {
  static propTypes = {
    categoryId: React.PropTypes.string,
    process: React.PropTypes.bool.isRequired,
    form: React.PropTypes.object.isRequired,
    intl: React.PropTypes.object.isRequired,
    createCategory: React.PropTypes.func.isRequired,
    saveCategory: React.PropTypes.func.isRequired,
    removeCategory: React.PropTypes.func.isRequired,
    selectCategory: React.PropTypes.func.isRequired,
    isNewCategory: React.PropTypes.bool.isRequired,
  };

  constructor(...args) {
    super(...args);

    this.state = {
      categoryDeleteModal: false,
      categoryDeleteError: false,
    };
  }

  render() {
    return (<div>{this.props.categoryId}</div>);
  }
}

let categoryForm = reduxForm({
  form: 'categoryEdit',
  propNamespace: 'form',
  enableReinitialize: true,
})(CategoryEditForm);

const processSelector = createSelector(
  state => state.category.process,
  process => process,
);

const categorySelector = createSelector(
  state => state.category.data,
  (_, props) => props.categoryId,
  (categoryData, categoryId) => {
    const tree = new TreeModel();
    const rootNode = tree.parse(categoryData);
    const findNode = rootNode.first((node) => node.model._id === categoryId);

    return get(findNode, 'model');
  }
);

const isNewCategorySelector = createSelector(
  categorySelector,
  categoryToEdit => isUndefined(categoryToEdit),
);

const selector = createSelector([
  processSelector,
  isNewCategorySelector,
], (process, isNewCategory) => ({
  process,
  isNewCategory,
}));

const mapDispatchToProps = dispatch => ({
  saveCategory: () => dispatch(),
  createCategory: () => dispatch(),
  removeCategory: () => dispatch(),
  selectCategory: categoryId => dispatch(push(`/dashboard/categories/${categoryId}`)),
});

categoryForm = connect(selector, mapDispatchToProps)(categoryForm);

export default injectIntl(categoryForm);
