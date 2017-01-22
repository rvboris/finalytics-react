import React from 'react';
import { connect } from 'react-redux';
import { get, isUndefined, pick, mapValues, isEmpty } from 'lodash';
import { createSelector } from 'reselect';
import { push } from 'react-router-redux';
import { reduxForm, Field, SubmissionError, formValueSelector } from 'redux-form';
import TreeModel from 'tree-model';
import { defineMessages, injectIntl, FormattedMessage } from 'react-intl';
import {
  Button,
  Form,
  FormGroup,
  FormFeedback,
  Label,
  Input,
  Alert,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from 'reactstrap';

import { virtualizedOptionRenderer, valueRenderer } from '../../utils/category-select';
import { categoryActions } from '../../actions';
import { error } from '../../log';
import SelectInput from '../SelectInput';
import validationHandler from '../../utils/validation-handler';

const messages = defineMessages({
  infoAlert: {
    id: 'component.categoryEditForm.infoAlert',
    description: 'Info alert',
    defaultMessage: 'Select an category to edit or create a new one',
  },
  isSystemAlert: {
    id: 'component.categoryEditForm.isSystemAlert',
    description: 'Is system category alert',
    defaultMessage: 'This system category, it can not be edited or deleted',
  },
  name: {
    label: {
      id: 'component.categoryEditForm.name.label',
      description: 'Label of category name field',
      defaultMessage: 'Name of category',
    },
    placeholder: {
      id: 'component.categoryEditForm.name.placeholder',
      description: 'Placeholder of category name field',
      defaultMessage: 'Name of category',
    },
  },
  type: {
    label: {
      id: 'component.categoryEditForm.type.label',
      description: 'Label of type field',
      defaultMessage: 'Type of category',
    },
  },
  parent: {
    label: {
      id: 'component.categoryEditForm.parent.label',
      description: 'Label of parent field',
      defaultMessage: 'Parent of category',
    },
  },
  saveProcessButton: {
    id: 'component.categoryEditForm.saveProcessButton',
    description: 'Label of button in process',
    defaultMessage: 'Saving...',
  },
  createButton: {
    id: 'component.categoryEditForm.createButton',
    description: 'Label of create button',
    defaultMessage: 'Create',
  },
  saveButton: {
    id: 'component.categoryEditForm.saveButton',
    description: 'Label of save button',
    defaultMessage: 'Save',
  },
  deleteButton: {
    id: 'component.categoryEditForm.deleteButton',
    description: 'Label of delete button',
    defaultMessage: 'Delete',
  },
  deleteProcessButton: {
    id: 'component.categoryEditForm.deleteProcessButton',
    description: 'Label of delete button in process',
    defaultMessage: 'Deleting...',
  },
  deleteModalTitle: {
    id: 'component.categoryEditForm.deleteModalTitle',
    description: 'Title of delete modal',
    defaultMessage: 'Delete category',
  },
  deleteModalConfirm: {
    id: 'component.categoryEditForm.deleteModalConfirm',
    description: 'Confirm text to delete category',
    defaultMessage: 'Are you sure want to delete your category {name}?',
  },
  deleteModalWarning: {
    id: 'component.categoryEditForm.deleteModalWarning',
    description: 'Warning text to delete category',
    defaultMessage: 'All your operations for this category will be moved in "no category"',
  },
  deleteModalError: {
    id: 'component.categoryEditForm.deleteModalError',
    description: 'Delete category error text',
    defaultMessage: 'When you delete an category error occurred',
  },
  cancelButton: {
    id: 'component.categoryEditForm.cancelButton',
    description: 'Label of cancel button',
    defaultMessage: 'Cancel',
  },
  expense: {
    id: 'component.categoryEditForm.expense',
    description: 'Expense type option',
    defaultMessage: 'Expense',
  },
  income: {
    id: 'component.categoryEditForm.income',
    description: 'Income type option',
    defaultMessage: 'Income',
  },
  any: {
    id: 'component.categoryEditForm.any',
    description: 'Any type option',
    defaultMessage: 'Any',
  },
});

const TextFormField = field =>
  <FormGroup color={field.meta.error ? 'danger' : null}>
    <Label>{field.label}</Label>
    <Input
      type="text"
      placeholder={field.placeholder}
      {...field.input}
    />
    {field.meta.touched && field.meta.error && <FormFeedback>{field.meta.error}</FormFeedback>}
  </FormGroup>;

const SelectFormField = field =>
  <FormGroup color={field.meta.error ? 'danger' : null}>
    <Label>{field.label}</Label>
    <SelectInput
      {...field}
      clearable={false}
      options={field.options}
    />
    {field.meta.touched && field.meta.error && <FormFeedback>{field.meta.error}</FormFeedback>}
  </FormGroup>;

const defaultValues = {
  type: 'expense',
  name: null,
  parent: null,
  _id: null,
};

const fieldsToEdit = Object.keys(defaultValues);
const availableTypesList = ['expense', 'income', 'any'];
const availableTypesListLabeled = availableTypesList.map(type => ({ value: type, label: type }));

class CategoryEditForm extends React.Component {
  static propTypes = {
    categoryId: React.PropTypes.string,
    process: React.PropTypes.bool.isRequired,
    form: React.PropTypes.object.isRequired,
    intl: React.PropTypes.object.isRequired,
    updateCategory: React.PropTypes.func.isRequired,
    removeCategory: React.PropTypes.func.isRequired,
    addCategory: React.PropTypes.func.isRequired,
    moveCategory: React.PropTypes.func.isRequired,
    selectCategory: React.PropTypes.func.isRequired,
    isNewCategory: React.PropTypes.bool.isRequired,
    isSystemCategory: React.PropTypes.bool.isRequired,
    availableParentsList: React.PropTypes.array.isRequired,
    availableTypesList: React.PropTypes.array.isRequired,
    canChangeType: React.PropTypes.bool.isRequired,
    categoryNode: React.PropTypes.object,
  };

  static getParentNode = (node) => {
    if (node.isRoot()) {
      return node;
    }

    const nodePath = node.getPath();

    return nodePath[nodePath.length - 2];
  };

  constructor(...args) {
    super(...args);

    this.state = {
      categoryDeleteModal: false,
      categoryDeleteError: false,
    };
  }

  getSubmitButton = () => {
    const { process } = this.props;
    const { submitting } = this.props.form;
    const disabled = submitting || process;

    let label;

    if (submitting || process) {
      label = <FormattedMessage {...messages.saveProcessButton} />;
    } else if (this.props.isNewCategory) {
      label = <FormattedMessage {...messages.createButton} />;
    } else {
      label = <FormattedMessage {...messages.saveButton} />;
    }

    return (<Button type="submit" color="primary" disabled={disabled}>{label}</Button>);
  };

  getDeleteButton = () => {
    if (this.props.isNewCategory) {
      return null;
    }

    return (
      <Button type="button" className="float-right" color="danger" onClick={this.toggleModal}>
        <FormattedMessage {...messages.deleteButton} />
      </Button>
    );
  };

  submitHandler = (values) => new Promise(async (resolve, reject) => {
    const { isNewCategory, categoryNode, addCategory, categoryId, intl } = this.props;
    let result;

    try {
      if (isNewCategory) {
        result = await addCategory({
          _id: values.parent,
          newNode: pick(values, ['name', 'type']),
        });
      } else {
        if (categoryNode) {
          const currentParentId = CategoryEditForm.getParentNode(categoryNode).model._id;

          if (currentParentId !== values.parent) {
            await this.props.moveCategory({ _id: categoryId, to: values.parent });
          }
        }

        result = await this.props.updateCategory({
          _id: categoryId,
          name: values.name,
        });
      }
    } catch (err) {
      error(err);

      const validationResult = validationHandler({
        _id: categoryId,
        name: values.name,
        type: values.type,
        to: values.parent,
      }, err);

      const validationResultErrors =
        mapValues(validationResult, val => intl.formatMessage({ id: val }));

      reject(new SubmissionError(validationResultErrors));

      return;
    }

    resolve(get(result, 'data.newId'));
  }).then((newId) => {
    const { isNewCategory, selectCategory } = this.props;

    if (!isNewCategory) {
      return;
    }

    selectCategory(newId);
  });

  toggleModal = () => {
    this.setState({ categoryDeleteModal: !this.state.categoryDeleteModal });
  };

  removeCategory = () => {
    const { removeCategory: remove, selectCategory, categoryId } = this.props;

    return remove({ _id: categoryId })
      .then(() => {
        this.toggleModal();
        selectCategory('');
      }, (e) => {
        error(e);
        this.setState(Object.assign(this.state, { categoryDeleteError: true }));
      });
  }

  render() {
    const {
      categoryId,
      isSystemCategory,
      availableParentsList,
      availableTypesList,
      canChangeType,
      process,
    } = this.props;

    const { formatMessage } = this.props.intl;
    const { handleSubmit, error: formError, initialValues } = this.props.form;
    const { categoryDeleteModal } = this.state;

    const deleteConfirmMessage =
      (<FormattedMessage
        {
        ...Object.assign(messages.deleteModalConfirm,
          { values: { name: (<strong>{initialValues.name}</strong>) } }
        )
        }
      />);

    if (!categoryId) {
      return (<Alert color="info"><FormattedMessage {...messages.infoAlert} /></Alert>);
    }

    if (isSystemCategory) {
      return (<Alert color="info"><FormattedMessage {...messages.isSystemAlert} /></Alert>);
    }

    return (
      <div>
        <Form onSubmit={handleSubmit(this.submitHandler)} noValidate>
          <Field
            label={formatMessage(messages.parent.label)}
            name="parent"
            options={availableParentsList}
            component={SelectFormField}
            optionRenderer={virtualizedOptionRenderer(true)}
            valueRenderer={valueRenderer(true)}
          />

          <Field
            label={formatMessage(messages.type.label)}
            name="type"
            options={availableTypesList}
            component={SelectFormField}
            disabled={!canChangeType}
          />

          <Field
            name="name"
            label={formatMessage(messages.name.label)}
            placeholder={formatMessage(messages.name.placeholder)}
            component={TextFormField}
            type="text"
          />

          { formError && <Alert color="danger">{formError}</Alert> }

          <div>
            { this.getSubmitButton() }
            { this.getDeleteButton() }
          </div>
        </Form>

        <Modal isOpen={categoryDeleteModal} toggle={this.toggleModal}>
          <ModalHeader toggle={this.toggleModal}>
            <FormattedMessage {...messages.deleteModalTitle} />
          </ModalHeader>
          <ModalBody>
            <p>{deleteConfirmMessage}</p>
            <Alert color="danger"><FormattedMessage {...messages.deleteModalWarning} /></Alert>
          </ModalBody>
          <ModalFooter>
            { this.state.accountDeleteError &&
              <p className="text-danger"><FormattedMessage {...messages.deleteModalError} /></p>
            }
            <Button
              type="button"
              onClick={this.removeCategory}
              disabled={process}
              color="danger"
              className="mr-3"
            >
              {
                this.props.process
                  ? <FormattedMessage {...messages.deleteProcessButton} />
                  : <FormattedMessage {...messages.deleteButton} />
              }
            </Button>
            <Button type="button" onClick={this.toggleModal} disabled={process}>
              <FormattedMessage {...messages.cancelButton} />
            </Button>
          </ModalFooter>
        </Modal>
      </div>
    );
  }
}

let categoryForm = reduxForm({
  form: 'categoryEdit',
  propNamespace: 'form',
  enableReinitialize: true,
})(CategoryEditForm);

const formFieldSelector = formValueSelector('categoryEdit');

const processSelector = createSelector(
  state => get(state, 'category.process', false),
  process => process,
);

const categoryTreeSelector = createSelector(
  state => get(state, 'category.data'),
  categoryData => {
    const tree = new TreeModel();
    const rootNode = tree.parse(categoryData);

    return rootNode;
  }
);

const categoryListSelector = createSelector(
  categoryTreeSelector,
  categoryTree => categoryTree.all()
);

const categoryNodeSelector = createSelector(
  categoryTreeSelector,
  (_, props) => props.categoryId,
  (categoryTree, categoryId) => {
    if (categoryId === 'new') {
      return undefined;
    }

    return categoryTree.first((node) => node.model._id === categoryId);
  }
);

const isNewCategorySelector = createSelector(
  categoryNodeSelector,
  categoryToEdit => isUndefined(categoryToEdit),
);

const isSystemCategorySelector = createSelector(
  categoryNodeSelector,
  isNewCategorySelector,
  (categoryNode, isNewCategory) => {
    if (isNewCategory) {
      return false;
    }

    return get(categoryNode, 'model.system', false);
  }
);

const categoryDefaultsSelector = createSelector(
  state => get(state, 'category.data'),
  categoryNodeSelector,
  (categoryData, categoryNode) => {
    let result = Object.assign({}, defaultValues);

    result.parent = categoryData._id;

    if (categoryNode) {
      result = pick(categoryNode.model, fieldsToEdit);
      result.parent = CategoryEditForm.getParentNode(categoryNode).model._id;
    } else {
      result._id = 'new';
    }

    return result;
  }
);

const initialValuesSelector = createSelector(
  (_, props) => props.categoryId,
  categoryDefaultsSelector,
  state => formFieldSelector(state, ...fieldsToEdit),
  categoryTreeSelector,
  isNewCategorySelector,
  (categoryId, initialValues, currentValues, categoryTree, isNewCategory) => {
    let values;

    if (categoryId === currentValues._id || (isNewCategory && !isEmpty(currentValues))) {
      values = currentValues;
    } else {
      values = initialValues;
    }

    if (categoryId !== currentValues._id && isNewCategory) {
      values = Object.assign({}, initialValues, { _id: categoryId });
    }

    const selectedParent = categoryTree.first(({ model }) => model._id === values.parent);

    if (selectedParent && !selectedParent.isRoot() && selectedParent.model.type !== 'any') {
      values.type = selectedParent.model.type;
    }

    return values;
  }
);

const availableParentsListSelector = createSelector(
  initialValuesSelector,
  categoryListSelector,
  isNewCategorySelector,
  (initialValues, categoryList, isNewCategory) => {
    const values = Object.assign({}, initialValues);
    const filteredList = isNewCategory
      ? categoryList
      : categoryList.filter(({ model }) =>
        (model.type === 'any' || model.type === values.type) && model._id !== values._id);

    return filteredList.map(node => ({
      value: node.model._id,
      label: node.model.name,
      node,
    }));
  }
);

const availableTypesListSelector = createSelector(
  initialValuesSelector,
  categoryTreeSelector,
  (_, { intl }) => intl.formatMessage,
  (initialValues, categoryTree, formatMessage) => {
    const values = Object.assign({}, initialValues);
    const selectedParent = categoryTree.first(({ model }) => model._id === values.parent);

    if (selectedParent && !selectedParent.isRoot() && selectedParent.model.type !== 'any') {
      return [{
        label: formatMessage(messages[selectedParent.model.type]),
        value: selectedParent.model.type,
      }];
    }

    return availableTypesListLabeled.map(type =>
      Object.assign({}, type, { label: formatMessage(messages[type.label]) })
    );
  }
);

const canChangeTypeSelector = createSelector(
  availableTypesListSelector,
  isNewCategorySelector,
  (availableTypesList, isNewCategory) => availableTypesList.length !== 1 && isNewCategory
);

const selector = createSelector([
  processSelector,
  categoryNodeSelector,
  isNewCategorySelector,
  isSystemCategorySelector,
  availableParentsListSelector,
  availableTypesListSelector,
  canChangeTypeSelector,
  initialValuesSelector,
], (
  process,
  categoryNode,
  isNewCategory,
  isSystemCategory,
  availableParentsList,
  availableTypesList,
  canChangeType,
  initialValues
) => ({
  process,
  categoryNode,
  isNewCategory,
  isSystemCategory,
  availableParentsList,
  availableTypesList,
  canChangeType,
  initialValues,
}));

const mapDispatchToProps = dispatch => ({
  updateCategory: (...args) => dispatch(categoryActions.update(...args)),
  removeCategory: (...args) => dispatch(categoryActions.remove(...args)),
  addCategory: (...args) => dispatch(categoryActions.add(...args)),
  moveCategory: (...args) => dispatch(categoryActions.move(...args)),
  selectCategory: categoryId => dispatch(push(`/dashboard/categories/${categoryId}`)),
});

categoryForm = connect(selector, mapDispatchToProps)(categoryForm);

export default injectIntl(categoryForm);
