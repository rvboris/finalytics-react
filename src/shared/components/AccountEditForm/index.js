import React from 'react';
import { connect } from 'react-redux';
import { createSelector } from 'reselect';
import { push } from 'react-router-redux';
import { reduxForm, Field, SubmissionError, formValueSelector } from 'redux-form';
import { mapValues, pick, invert, get, isUndefined } from 'lodash';
import { defineMessages, injectIntl, FormattedMessage } from 'react-intl';
import {
  Button,
  FormControl,
  FormGroup,
  ControlLabel,
  HelpBlock,
  InputGroup,
  Alert,
  Modal,
} from 'react-bootstrap';

import { error } from '../../log';
import { accountActions } from '../../actions';
import validationHandler from '../../utils/validation-handler';
import SelectInput from '../SelectInput';
import ToggleInput from '../ToggleInput';
import MoneyInput from '../MoneyInput';
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

const NumberFormField = field =>
  <FormGroup controlId={field.name} validationState={field.meta.error ? 'error' : null}>
    <ControlLabel>{field.label}</ControlLabel>
    <InputGroup>
      <MoneyInput {...field} className="form-control" />
      <InputGroup.Addon>{field.currency.code}</InputGroup.Addon>
    </InputGroup>
    <FormControl.Feedback />
    {field.meta.touched && field.meta.error && <HelpBlock>{field.meta.error}</HelpBlock>}
  </FormGroup>;

const SelectFormField = field =>
  <FormGroup controlId={field.name} validationState={field.meta.error ? 'error' : null}>
    <ControlLabel>{field.label}</ControlLabel>
    <SelectInput
      {...field}
      options={field.options}
      clearable={false}
    />
    <FormControl.Feedback />
    {field.meta.touched && field.meta.error && <HelpBlock>{field.meta.error}</HelpBlock>}
  </FormGroup>;

const ToggleFormField = field =>
  <FormGroup controlId={field.name} validationState={field.meta.error ? 'error' : null}>
    <ControlLabel>
      <span className={style['toggle-label']}>{field.label}</span>
      <ToggleInput {...field} />
    </ControlLabel>
    <FormControl.Feedback />
    {field.meta.touched && field.meta.error && <HelpBlock>{field.meta.error}</HelpBlock>}
  </FormGroup>;

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
    accountId: React.PropTypes.string,
    process: React.PropTypes.bool.isRequired,
    form: React.PropTypes.object.isRequired,
    intl: React.PropTypes.object.isRequired,
    createAccount: React.PropTypes.func.isRequired,
    saveAccount: React.PropTypes.func.isRequired,
    removeAccount: React.PropTypes.func.isRequired,
    selectAccount: React.PropTypes.func.isRequired,
    currencyList: React.PropTypes.array.isRequired,
    selectedCurrency: React.PropTypes.object.isRequired,
    isNewAccount: React.PropTypes.bool.isRequired,
  };

  constructor(...args) {
    super(...args);

    this.state = {
      accountDeleteModal: false,
      accountDeleteError: false,
    };
  }

  getSubmitButton = () => {
    const { pristine, submitting } = this.props.form;
    const disabled = pristine || submitting || this.props.process;

    let label;

    if (submitting || this.props.process) {
      label = <FormattedMessage {...messages.saveProcessButton} />;
    } else if (this.props.isNewAccount) {
      label = <FormattedMessage {...messages.createButton} />;
    } else {
      label = <FormattedMessage {...messages.saveButton} />;
    }

    return (<Button type="submit" bsStyle="primary" disabled={disabled}>{label}</Button>);
  };

  getDeleteButton = () => {
    if (this.props.isNewAccount) {
      return null;
    }

    return (
      <Button className="pull-right" bsStyle="danger" onClick={this.toggleModal}>
        <FormattedMessage {...messages.deleteButton} />
      </Button>
    );
  };

  submitHandler = (values) => {
    const toValidate = Object.assign({}, defaultValues, values);

    toValidate.type = invert(accountTypeMap)[toValidate.type];

    if (!this.props.isNewAccount) {
      toValidate._id = this.props.accountId;
    }

    return new Promise(async function submitPromise(resolve, reject) {
      let result;

      try {
        if (this.props.isNewAccount) {
          result = await this.props.createAccount(toValidate);
        } else {
          result = await this.props.saveAccount(toValidate);
        }
      } catch (err) {
        const validationResult =
          mapValues(validationHandler(toValidate, err),
            val => this.props.intl.formatMessage({ id: val }));

        reject(new SubmissionError(validationResult));
        return;
      }

      const accounts = get(result, 'data.accounts', []);
      const account = accounts.find(account => account.name === toValidate.name);

      resolve(account);
    }).then((account) => {
      if (!this.props.isNewAccount) {
        return;
      }

      this.props.selectAccount(account._id);
    });
  };

  toggleModal = () => {
    this.setState({ accountDeleteModal: !this.state.accountDeleteModal });
  };

  removeAccount = () =>
    this.props.removeAccount({ _id: this.props.accountId })
      .then(() => {
        this.toggleModal();
        this.props.selectAccount('');
      }, (e) => {
        error(e);
        this.setState(Object.assign(this.state, { accountDeleteError: true }));
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

    if (!this.props.accountId) {
      return (<Alert><FormattedMessage {...messages.infoAlert} /></Alert>);
    }

    return (
      <div>
        <form onSubmit={handleSubmit(this.submitHandler)} noValidate>
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
            options={this.props.currencyList}
            component={SelectFormField}
          />

          <Field
            label={formatMessage(messages.type.label)}
            name="type"
            component={ToggleFormField}
          />

          <Field
            name="startBalance"
            label={formatMessage(messages.startBalance.label)}
            placeholder={formatMessage(messages.startBalance.placeholder)}
            component={NumberFormField}
            currency={this.props.selectedCurrency}
            type="number"
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

let accountForm = reduxForm({
  form: 'accountEdit',
  propNamespace: 'form',
  enableReinitialize: true,
})(AccountEditForm);

const formFieldSelector = formValueSelector('accountEdit');

const processSelector = createSelector(
  state => state.account.process,
  process => process,
);

const currencyListSelector = createSelector(
  state => state.currency.currencyList,
  currencyList => currencyList.map(currency => ({
    value: currency._id,
    label: `${currency.translatedName} (${currency.code})`,
  })),
);

const accountSelector = createSelector(
  state => state.account.accounts,
  (_, props) => props.accountId,
  (accountList, accountId) => accountList.find(account => account._id === accountId),
);

const isNewAccountSelector = createSelector(
  accountSelector,
  accountToEdit => isUndefined(accountToEdit),
);

const accountDefaultsSelector = createSelector(
  accountSelector,
  state => state.currency.currencyList,
  state => state.auth.profile.settings.locale,
  (accountToEdit, currencyList, locale) => {
    let result = defaultValues;

    if (accountToEdit) {
      result = pick(accountToEdit, fieldsToEdit);
    }

    if (!result.currency) {
      const currencyCode = locale === 'ru' ? 'RUB' : 'USD';
      const defaultCurrency = currencyList.find(currency => currency.code === currencyCode);

      result.currency = defaultCurrency._id;
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
  state => state.currency.currencyList,
  (initialValues, currentValues, currencyList) => {
    const values = Object.assign({}, initialValues, currentValues);
    const selectedCurrency = currencyList.find(currency => currency._id === values.currency);

    return selectedCurrency;
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
