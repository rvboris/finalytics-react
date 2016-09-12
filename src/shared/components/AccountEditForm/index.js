import React from 'react';
import { connect } from 'react-redux';
import { createSelector } from 'reselect';
import { push } from 'react-router-redux';
import { reduxForm, Field, SubmissionError, formValueSelector } from 'redux-form';
import { mapValues, pick, invert, get } from 'lodash';
import { defineMessages, injectIntl, FormattedMessage } from 'react-intl';
import {
  Button,
  FormControl,
  FormGroup,
  ControlLabel,
  HelpBlock,
  InputGroup,
  Alert,
} from 'react-bootstrap';

import validationHandler from '../../utils/validation-handler';
import SelectInput from '../SelectInput';
import ToggleInput from '../ToggleInput';
import { accountActions } from '../../actions';
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
  processButton: {
    id: 'component.accountEditForm.processButton',
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
});

const TextFormField = (field) =>
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

const NumberFormField = (field) =>
  <FormGroup controlId={field.name} validationState={field.meta.error ? 'error' : null}>
    <ControlLabel>{field.label}</ControlLabel>
    <InputGroup>
      <FormControl
        type="number"
        step="0.01"
        pattern="[0-9]+([,\.][0-9]+)?"
        placeholder={field.placeholder}
        {...field.input}
      />
      <InputGroup.Addon>{field.currency.code}</InputGroup.Addon>
    </InputGroup>
    <FormControl.Feedback />
    {field.meta.touched && field.meta.error && <HelpBlock>{field.meta.error}</HelpBlock>}
  </FormGroup>;

const SelectFormField = (field) =>
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

const ToggleFormField = (field) =>
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

let AccountEditForm = (props) => {
  const {
    form: { error, handleSubmit, pristine, submitting },
    intl: { formatMessage },
    process,
    createAccount,
    selectAccount,
    saveAccount,
    currencyList,
    selectedCurrency,
    accountId,
  } = props;

  const isNew = accountId === 'new';

  const submitHandler = (values) => {
    const toValidate = Object.assign({}, defaultValues, values);

    toValidate.type = invert(accountTypeMap)[toValidate.type];

    if (!isNew) {
      toValidate._id = accountId;
    }

    return new Promise(async (resolve, reject) => {
      let result;

      try {
        if (isNew) {
          result = await createAccount(toValidate);
        } else {
          result = await saveAccount(toValidate);
        }
      } catch (err) {
        const validationResult =
          mapValues(validationHandler(toValidate, err), (val) => formatMessage({ id: val }));

        reject(new SubmissionError(validationResult));
        return;
      }

      const accounts = get(result, 'data.accounts', []);
      const account = accounts.find((account) => account.name === toValidate.name);

      resolve(account);
    }).then((account) => {
      if (!isNew) {
        return;
      }

      selectAccount(account._id);
    });
  };

  if (!props.accountId) {
    return (<Alert><FormattedMessage {...messages.infoAlert} /></Alert>);
  }

  const buttonLabel = isNew
    ? <FormattedMessage {...messages.createButton} />
    : <FormattedMessage {...messages.saveButton} />;

  return (
    <div>
      <form onSubmit={handleSubmit(submitHandler)} noValidate>
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
        />

        <Field
          label={formatMessage(messages.type.label)}
          name="type"
          component={ToggleFormField}
          className="test"
        />

        <Field
          name="startBalance"
          label={formatMessage(messages.startBalance.label)}
          placeholder={formatMessage(messages.startBalance.placeholder)}
          component={NumberFormField}
          currency={selectedCurrency}
          type="number"
        />

        { error && <Alert bsStyle="danger">{error}</Alert> }

        <div className={style['action-buttons']}>
          <Button
            type="submit"
            bsStyle="primary"
            disabled={pristine || submitting || process}
          >
            {
              (submitting || process)
                ? <FormattedMessage {...messages.processButton} />
                : buttonLabel
            }
          </Button>
        </div>
      </form>
    </div>
  );
};

AccountEditForm.propTypes = {
  accountId: React.PropTypes.string,
  process: React.PropTypes.bool.isRequired,
  form: React.PropTypes.object.isRequired,
  intl: React.PropTypes.object.isRequired,
  createAccount: React.PropTypes.func.isRequired,
  saveAccount: React.PropTypes.func.isRequired,
  selectAccount: React.PropTypes.func.isRequired,
  currencyList: React.PropTypes.array.isRequired,
  selectedCurrency: React.PropTypes.object.isRequired,
};

AccountEditForm = reduxForm({
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
  currencyList => currencyList.map((currency) => ({
    value: currency._id,
    label: `${currency.translatedName} (${currency.code})`,
  })),
);

const accountSelector = createSelector(
  state => state.currency.currencyList,
  state => state.account.accounts,
  state => state.auth.profile.settings.locale,
  (_, props) => props.accountId,
  (currencyList, accountList, locale, accountId) => {
    let result = defaultValues;

    if (accountId) {
      const accountToEdit = accountList.find((account) => account._id === accountId);

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
    }

    return result;
  }
);

const selectedCurrencySelector = createSelector(
  accountSelector,
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
  accountSelector,
  selectedCurrencySelector,
], (process, currencyList, initialValues, selectedCurrency) => ({
  process,
  currencyList,
  initialValues,
  selectedCurrency,
}));

const mapDispatchToProps = (dispatch) => ({
  saveAccount: (...args) => dispatch(accountActions.save(...args)),
  createAccount: (...args) => dispatch(accountActions.create(...args)),
  selectAccount: (accountId) => dispatch(push(`/dashboard/accounts/${accountId}`)),
});

AccountEditForm = connect(selector, mapDispatchToProps)(AccountEditForm);

export default injectIntl(AccountEditForm);
