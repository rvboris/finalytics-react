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
  FormControl,
  FormGroup,
  ControlLabel,
  HelpBlock,
  Alert,
  Modal,
} from 'react-bootstrap';

import { categoryActions } from '../../actions';
import { error } from '../../log';
import SelectInput from '../SelectInput';
import validationHandler from '../../utils/validation-handler';
import style from './style.css';

const messages = defineMessages({
  infoAlert: {
    id: 'component.accountEditForm.infoAlert',
    description: 'Info alert',
    defaultMessage: 'Select an account to edit or create a new one',
  },
  name: {
    label: {
      id: 'component.accountEditForm.name.label',
      description: 'Label of account name field',
      defaultMessage: 'Name of account',
    },
    placeholder: {
      id: 'component.accountEditForm.name.placeholder',
      description: 'Placeholder of account name field',
      defaultMessage: 'Name of account',
    },
  },
  currencyId: {
    label: {
      id: 'component.accountEditForm.currencyId.label',
      description: 'Label of currency field',
      defaultMessage: 'Currency of account',
    },
  },
  startBalance: {
    label: {
      id: 'component.accountEditForm.startBalance.label',
      description: 'Label of startBalance field',
      defaultMessage: 'Start balance',
    },
    placeholder: {
      id: 'component.accountEditForm.startBalance.placeholder',
      description: 'Placeholder of startBalance field',
      defaultMessage: '0.00',
    },
  },
  type: {
    label: {
      id: 'component.accountEditForm.type.label',
      description: 'Label of type field',
      defaultMessage: 'This is a debt or a loan?',
    },
  },
  saveProcessButton: {
    id: 'component.accountEditForm.saveProcessButton',
    description: 'Label of button in process',
    defaultMessage: 'Saving...',
  },
  createButton: {
    id: 'component.accountEditForm.createButton',
    description: 'Label of create button',
    defaultMessage: 'Create',
  },
  saveButton: {
    id: 'component.accountEditForm.saveButton',
    description: 'Label of save button',
    defaultMessage: 'Save',
  },
  deleteButton: {
    id: 'component.accountEditForm.deleteButton',
    description: 'Label of delete button',
    defaultMessage: 'Delete',
  },
  deleteProcessButton: {
    id: 'component.accountEditForm.deleteProcessButton',
    description: 'Label of delete button in process',
    defaultMessage: 'Deleting...',
  },
  deleteModalTitle: {
    id: 'component.accountEditForm.deleteModalTitle',
    description: 'Title of delete modal',
    defaultMessage: 'Delete account',
  },
  deleteModalConfirm: {
    id: 'component.accountEditForm.deleteModalConfirm',
    description: 'Confirm text to delete account',
    defaultMessage: 'Are you sure want to delete your account {name}?',
  },
  deleteModalWarning: {
    id: 'component.accountEditForm.deleteModalWarning',
    description: 'Warning text to delete account',
    defaultMessage: 'All your operations for this account will be removed.',
  },
  deleteModalNotice: {
    id: 'component.accountEditForm.deleteModalNotice',
    description: 'Notice text to delete account',
    defaultMessage: 'You can also close the account so as not to see it in the list.',
  },
  deleteModalError: {
    id: 'component.accountEditForm.deleteModalError',
    description: 'Delete account error text',
    defaultMessage: 'When you delete an account error occurred',
  },
  cancelButton: {
    id: 'component.accountEditForm.cancelButton',
    description: 'Label of cancel button',
    defaultMessage: 'Cancel',
  },
});

const TextFormField = field =>
  <FormGroup controlId={field.name} validationState={field.meta.error ? 'error' : null}>
    <ControlLabel>{field.label}</ControlLabel>
    <FormControl
      type="text"
      placeholder={field.placeholder}
      {...field.input}
    />
    <FormControl.Feedback />
    {field.meta.touched && field.meta.error && <HelpBlock>{field.meta.error}</HelpBlock>}
  </FormGroup>;

const SelectFormField = field =>
  <FormGroup controlId={field.name} validationState={field.meta.error ? 'error' : null}>
    <ControlLabel>{field.label}</ControlLabel>
    <SelectInput
      {...field}
      clearable={false}
      options={field.options}
    />
    <FormControl.Feedback />
    {field.meta.touched && field.meta.error && <HelpBlock>{field.meta.error}</HelpBlock>}
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
  };

  constructor(...args) {
    super(...args);

    this.state = {
      categoryDeleteModal: false,
      categoryDeleteError: false,
    };
  }

  componentWillReceiveProps() {
  }

  getSubmitButton = () => {
    const { submitting } = this.props.form;
    const disabled = submitting || this.props.process;

    let label;

    if (submitting || this.props.process) {
      label = <FormattedMessage {...messages.saveProcessButton} />;
    } else if (this.props.isNewCategory) {
      label = <FormattedMessage {...messages.createButton} />;
    } else {
      label = <FormattedMessage {...messages.saveButton} />;
    }

    return (<Button type="submit" bsStyle="primary" disabled={disabled}>{label}</Button>);
  };

  getDeleteButton = () => {
    if (this.props.isNewCategory) {
      return null;
    }

    return (
      <Button className="pull-right" bsStyle="danger" onClick={this.toggleModal}>
        <FormattedMessage {...messages.deleteButton} />
      </Button>
    );
  };

  submitHandler = (values) => {
    const toValidate = {};

    toValidate._id = this.props.isNewCategory ? values.parent : this.props.categoryId;

    return new Promise(async (resolve, reject) => {
      try {
        if (this.props.isNewCategory) {
          toValidate.newNode = pick(values, ['name', 'type']);
          await this.props.addCategory(toValidate);
        } else {
          toValidate.name = values.name;

          if (this.props.form.initialValues.parent !== values.parent) {
            toValidate.to = values.parent;
            await this.props.moveCategory(toValidate);
          }

          await this.props.updateCategory(toValidate);
        }
      } catch (err) {
        error(err);

        const validationResult =
          mapValues(validationHandler(toValidate, err),
            val => this.props.intl.formatMessage({ id: val }));

        reject(new SubmissionError(validationResult));

        return;
      }

      resolve();
    }).then((category) => {
      if (!this.props.isNewCategory) {
        return;
      }

      this.props.selectCategory(category._id);
    });
  };

  toggleModal = () => {
    this.setState({ categoryDeleteModal: !this.state.categoryDeleteModal });
  };

  removeAccount = () =>
    this.props.removeCategory({ _id: this.props.categoryId })
      .then(() => {
        this.toggleModal();
        this.props.selectCategory('');
      }, (e) => {
        error(e);
        this.setState(Object.assign(this.state, { categoryDeleteError: true }));
      });

  render() {
    const { formatMessage } = this.props.intl;
    const { handleSubmit, error, initialValues } = this.props.form;
    const deleteConfirmMessage =
      (<FormattedMessage
        {
        ...Object.assign(messages.deleteModalConfirm,
          { values: { name: (<strong>{initialValues.name}</strong>) } }
        )
        }
      />);

    if (!this.props.categoryId) {
      return (<Alert>1</Alert>);
    }

    if (this.props.isSystemCategory) {
      return (<Alert>2</Alert>);
    }

    return (
      <div>
        <form onSubmit={handleSubmit(this.submitHandler)} noValidate>
          <Field
            label={formatMessage(messages.currencyId.label)}
            name="parent"
            options={this.props.availableParentsList}
            component={SelectFormField}
          />

          <Field
            label={formatMessage(messages.currencyId.label)}
            name="type"
            options={this.props.availableTypesList}
            component={SelectFormField}
            disabled={!this.props.canChangeType}
          />

          <Field
            name="name"
            label={formatMessage(messages.name.label)}
            placeholder={formatMessage(messages.name.placeholder)}
            component={TextFormField}
            type="text"
          />

          { error && <Alert bsStyle="danger">{error}</Alert> }

          <div className={style['action-buttons']}>
            { this.getSubmitButton() }
            { this.getDeleteButton() }
          </div>
        </form>

        <Modal show={this.state.accountDeleteModal}>
          <Modal.Header>
            <Modal.Title><FormattedMessage {...messages.deleteModalTitle} /></Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <p>{deleteConfirmMessage}</p>
            <Alert bsStyle="danger"><FormattedMessage {...messages.deleteModalWarning} /></Alert>
            <Alert bsStyle="info"><FormattedMessage {...messages.deleteModalNotice} /></Alert>
          </Modal.Body>
          <Modal.Footer>
            { this.state.accountDeleteError &&
              <p className="text-danger pull-left"><FormattedMessage {...messages.deleteModalError} /></p>
            }

            <Button onClick={this.removeAccount} disabled={this.props.process} bsStyle="danger">
              {
                this.props.process
                  ? <FormattedMessage {...messages.deleteProcessButton} />
                  : <FormattedMessage {...messages.deleteButton} />
              }
            </Button>
            <Button onClick={this.toggleModal} disabled={this.props.process}>
              <FormattedMessage {...messages.cancelButton} />
            </Button>
          </Modal.Footer>
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
  state => state.category.process,
  process => process,
);

const categoryTreeSelector = createSelector(
  state => state.category.data,
  categoryData => {
    const tree = new TreeModel();
    const rootNode = tree.parse(categoryData);

    return rootNode;
  }
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

const getParentNode = (node) => {
  if (node.isRoot()) {
    return node;
  }

  const nodePath = node.getPath();

  return nodePath[nodePath.length - 2];
};

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
  state => state.category.data,
  categoryNodeSelector,
  (categoryData, categoryNode) => {
    let result = Object.assign({}, defaultValues);

    result.parent = categoryData._id;

    if (categoryNode) {
      result = pick(categoryNode.model, fieldsToEdit);
      result.parent = getParentNode(categoryNode).model._id;
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

    const selectedParent = categoryTree.first(node => node.model._id === values.parent);

    if (selectedParent && !selectedParent.isRoot() && selectedParent.model.type !== 'any') {
      values.type = selectedParent.model.type;
    }

    return values;
  }
);

const getNodeLabel = node => `${'- - '.repeat(node.getPath().length - 1)} ${node.model.name}`;

const availableParentsListSelector = createSelector(
  initialValuesSelector,
  categoryTreeSelector,
  isNewCategorySelector,
  (initialValues, categoryTree, isNewCategory) => {
    const values = Object.assign({}, initialValues);
    const parentsList = categoryTree.all();
    const filteredList = isNewCategory
      ? parentsList
      : parentsList.filter(node =>
        (node.model.type === 'any' || node.model.type === values.type)
        && node.model._id !== values._id
      );

    return filteredList.map(node => ({ value: node.model._id, label: getNodeLabel(node) }));
  }
);

const availableTypesListSelector = createSelector(
  initialValuesSelector,
  categoryTreeSelector,
  (initialValues, categoryTree) => {
    const values = Object.assign({}, initialValues);
    const selectedParent = categoryTree.first(node => node.model._id === values.parent);

    if (selectedParent && !selectedParent.isRoot() && selectedParent.model.type !== 'any') {
      return [{ label: selectedParent.model.type, value: selectedParent.model.type }];
    }

    return availableTypesListLabeled;
  }
);

const canChangeTypeSelector = createSelector(
  availableTypesListSelector,
  isNewCategorySelector,
  (availableTypesList, isNewCategory) => availableTypesList.length !== 1 && isNewCategory
);

const selector = createSelector([
  processSelector,
  isNewCategorySelector,
  isSystemCategorySelector,
  availableParentsListSelector,
  availableTypesListSelector,
  canChangeTypeSelector,
  initialValuesSelector,
], (
  process,
  isNewCategory,
  isSystemCategory,
  availableParentsList,
  availableTypesList,
  canChangeType,
  initialValues
) => ({
  process,
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
