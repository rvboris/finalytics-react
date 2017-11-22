import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';
import { createSelector } from 'reselect';
import { push } from 'react-router-redux';
import { reduxForm, Field, SubmissionError, formValueSelector } from 'redux-form';
import { mapValues, pick, invert, get, isUndefined } from 'lodash';
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
  InputGroup,
  InputGroupAddon,
} from 'reactstrap';

import { error } from '../../log';
import { accountActions } from '../../actions';
import validationHandler from '../../utils/validation-handler';
import SelectInput from '../SelectInput';
import ToggleInput from '../ToggleInput';
import MoneyInput from '../MoneyInput';

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

const TextFormField = field => (
  <FormGroup color={field.meta.error ? 'danger' : null}>
    <Label>{field.label}</Label>
    <Input
      type="text"
      placeholder={field.placeholder}
      {...field.input}
    />
    {field.meta.touched && field.meta.error && <FormFeedback>{field.meta.error}</FormFeedback>}
  </FormGroup>
);

const NumberFormField = field => (
  <FormGroup color={field.meta.error ? 'danger' : null}>
    <Label>{field.label}</Label>
    <InputGroup>
      <MoneyInput {...field} className="form-control" />
      <InputGroupAddon>{field.currency.code}</InputGroupAddon>
    </InputGroup>
    {field.meta.touched && field.meta.error && <FormFeedback>{field.meta.error}</FormFeedback>}
  </FormGroup>
);

const SelectFormField = field => (
  <FormGroup color={field.meta.error ? 'danger' : null}>
    <Label>{field.label}</Label>
    <SelectInput
      {...field}
      options={field.options}
      clearable={false}
    />
    {field.meta.touched && field.meta.error && <FormFeedback>{field.meta.error}</FormFeedback>}
  </FormGroup>
);

const ToggleFormField = field => (
  <FormGroup color={field.meta.error ? 'danger' : null}>
    <Label>{field.label}</Label>
    <ToggleInput {...field} />
    {field.meta.touched && field.meta.error && <FormFeedback>{field.meta.error}</FormFeedback>}
  </FormGroup>
);

const defaultValues = {
  name: null,
  currency: null,
  startBalance: null,
  type: null,
};

const fieldsToEdit = Object.keys(defaultValues);

const accountTypeMap = {
  standart: false,
  debt: true,
};

class AccountEditForm extends React.Component {
  static propTypes = {
    form: PropTypes.object.isRequired,
    intl: PropTypes.object.isRequired,
    isNewAccount: PropTypes.bool.isRequired,
    accountId: PropTypes.string,
    process: PropTypes.bool.isRequired,
    createAccount: PropTypes.func.isRequired,
    saveAccount: PropTypes.func.isRequired,
    removeAccount: PropTypes.func.isRequired,
    selectAccount: PropTypes.func.isRequired,
    currencyList: PropTypes.array.isRequired,
    selectedCurrency: PropTypes.object.isRequired,
  };

  static defaultProps = {
    accountId: null,
  };

  constructor(...args) {
    super(...args);

    this.state = {
      accountDeleteModal: false,
      accountDeleteError: false,
    };
  }

  getSubmitButton = () => {
    const { process } = this.props;
    const { pristine, submitting } = this.props.form;
    const disabled = pristine || submitting || this.props.process;

    let label;

    if (submitting || process) {
      label = <FormattedMessage {...messages.saveProcessButton} />;
    } else if (this.props.isNewAccount) {
      label = <FormattedMessage {...messages.createButton} />;
    } else {
      label = <FormattedMessage {...messages.saveButton} />;
    }

    return (<Button type="submit" color="primary" disabled={disabled}>{label}</Button>);
  };

  getDeleteButton = () => {
    if (this.props.isNewAccount) {
      return null;
    }

    return (
      <Button className="float-right" color="danger" onClick={this.toggleModal}>
        <FormattedMessage {...messages.deleteButton} />
      </Button>
    );
  };

  submitHandler = (values) => {
    const {
      isNewAccount, accountId, createAccount, saveAccount, selectAccount, intl,
    } = this.props;
    const toValidate = Object.assign({}, defaultValues, values);

    toValidate.type = invert(accountTypeMap)[toValidate.type];

    if (!isNewAccount) {
      toValidate._id = accountId;
    }

    return new Promise(async (resolve, reject) => {
      let result;

      try {
        if (isNewAccount) {
          result = await createAccount(toValidate);
        } else {
          result = await saveAccount(toValidate);
        }
      } catch (err) {
        const validationResult =
          mapValues(validationHandler(toValidate, err), val => intl.formatMessage({ id: val }));

        reject(new SubmissionError(validationResult));

        return;
      }

      const accounts = get(result, 'data.accounts', []);
      const account = accounts.find(account => account.name === toValidate.name);

      resolve(account);
    }).then((account) => {
      if (!isNewAccount) {
        return;
      }

      selectAccount(account._id);
    });
  };

  toggleModal = () => {
    this.setState({ accountDeleteModal: !this.state.accountDeleteModal });
  };

  removeAccount = () => {
    const { removeAccount, selectAccount, accountId } = this.props;

    return removeAccount({ _id: accountId })
      .then(() => {
        this.toggleModal();
        selectAccount('');
      }, (e) => {
        error(e);
        this.setState(Object.assign(this.state, { accountDeleteError: true }));
      });
  };

  render() {
    const {
      accountId, isNewAccount, currencyList, selectedCurrency, process,
    } = this.props;
    const { formatMessage } = this.props.intl;
    const { handleSubmit, error: formError, initialValues } = this.props.form;
    const deleteConfirmMessage =
      (<FormattedMessage
        {
        ...Object.assign(
          messages.deleteModalConfirm,
          { values: { name: (<strong>{initialValues.name}</strong>) } }
        )
        }
      />);

    if (!accountId) {
      return (<Alert color="info"><FormattedMessage {...messages.infoAlert} /></Alert>);
    }

    return (
      <div>
        <Form onSubmit={handleSubmit(this.submitHandler)} noValidate>
          <Field
            name="name"
            label={formatMessage(messages.name.label)}
            placeholder={formatMessage(messages.name.placeholder)}
            component={TextFormField}
            type="text"
          />

          <Field
            label={formatMessage(messages.currencyId.label)}
            name="currency"
            options={currencyList}
            component={SelectFormField}
            disabled={!isNewAccount}
          />

          <Field
            label={formatMessage(messages.type.label)}
            name="type"
            component={ToggleFormField}
            disabled={!isNewAccount}
          />

          <Field
            name="startBalance"
            label={formatMessage(messages.startBalance.label)}
            placeholder={formatMessage(messages.startBalance.placeholder)}
            component={NumberFormField}
            currency={selectedCurrency}
            type="number"
          />

          { formError && <Alert color="danger">{formError}</Alert> }

          <div>
            { this.getSubmitButton() }
            { this.getDeleteButton() }
          </div>
        </Form>

        <Modal isOpen={this.state.accountDeleteModal} toggle={this.toggleModal}>
          <ModalHeader toggle={this.toggleModal}>
            <FormattedMessage {...messages.deleteModalTitle} />
          </ModalHeader>
          <ModalBody>
            <p>{deleteConfirmMessage}</p>
            <Alert color="danger"><FormattedMessage {...messages.deleteModalWarning} /></Alert>
            <Alert color="info"><FormattedMessage {...messages.deleteModalNotice} /></Alert>
          </ModalBody>
          <ModalFooter>
            { this.state.accountDeleteError &&
              <p className="text-danger">
                <FormattedMessage {...messages.deleteModalError} />
              </p>
            }

            <Button
              type="button"
              onClick={this.removeAccount}
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

let accountForm = reduxForm({
  form: 'accountEdit',
  propNamespace: 'form',
  enableReinitialize: true,
})(AccountEditForm);

const formFieldSelector = formValueSelector('accountEdit');

const processSelector = createSelector(
  state => get(state, 'account.process', false),
  process => process,
);

const currencyListSelector = createSelector(
  state => get(state, 'currency.currencyList', []),
  currencyList => currencyList.map(currency => ({
    value: currency._id,
    label: `${currency.translatedName} (${currency.code})`,
  })),
);

const accountSelector = createSelector(
  state => get(state, 'account.accounts', []),
  (_, props) => props.accountId,
  (accountList, accountId) => accountList.find(({ _id }) => _id === accountId),
);

const isNewAccountSelector = createSelector(
  accountSelector,
  accountToEdit => isUndefined(accountToEdit),
);

const accountDefaultsSelector = createSelector(
  accountSelector,
  state => get(state, 'currency.currencyList', []),
  state => get(state, 'auth.profile.settings.baseCurrency'),
  (accountToEdit, currencyList, baseCurrency) => {
    let result = defaultValues;

    if (accountToEdit) {
      result = pick(accountToEdit, fieldsToEdit);
    }

    if (!result.currency) {
      result.currency = baseCurrency;
    }

    if (!result.type) {
      result.type = false;
    } else {
      result.type = accountTypeMap[result.type];
    }

    return result;
  }
);

const selectedCurrencySelector = createSelector(
  accountDefaultsSelector,
  state => formFieldSelector(state, ...fieldsToEdit),
  state => get(state, 'currency.currencyList'),
  (initialValues, currentValues, currencyList) => {
    const values = Object.assign({}, initialValues, currentValues);
    return currencyList.find(({ _id }) => _id === values.currency);
  },
);

const selector = createSelector([
  processSelector,
  currencyListSelector,
  accountDefaultsSelector,
  selectedCurrencySelector,
  isNewAccountSelector,
], (process, currencyList, initialValues, selectedCurrency, isNewAccount) => ({
  process,
  currencyList,
  initialValues,
  selectedCurrency,
  isNewAccount,
}));

const mapDispatchToProps = dispatch => ({
  saveAccount: (...args) => dispatch(accountActions.save(...args)),
  createAccount: (...args) => dispatch(accountActions.create(...args)),
  removeAccount: (...args) => dispatch(accountActions.remove(...args)),
  selectAccount: accountId => dispatch(push(`/dashboard/accounts/${accountId}`)),
});

accountForm = connect(selector, mapDispatchToProps)(accountForm);

export default injectIntl(accountForm);
