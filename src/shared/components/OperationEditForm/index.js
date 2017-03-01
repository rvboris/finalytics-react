import React from 'react';
import { connect } from 'react-redux';
import { createSelector } from 'reselect';
import {
  reduxForm,
  Field,
  formValueSelector,
  SubmissionError,
  change,
} from 'redux-form';
import { get, isUndefined, omitBy, mapValues } from 'lodash';
import { defineMessages, injectIntl, FormattedMessage } from 'react-intl';
import classnames from 'classnames';
import TreeModel from 'tree-model';
import moment from 'moment';
import {
  Card,
  CardHeader,
  CardBlock,
  ButtonGroup,
  Button,
  Form,
  FormGroup,
  FormFeedback,
  Label,
  InputGroup,
  InputGroupAddon,
  Alert,
} from 'reactstrap';

import config from '../../config';
import eventEmitter from '../../utils/event-emitter';
import validationHandler from '../../utils/validation-handler';
import { optionRenderer, valueRenderer } from '../../utils/category-select';
import { operationActions } from '../../actions';
import { error } from '../../log';
import DatePicker from '../DatePicker';
import MoneyInput, { toNegative, toPositive } from '../MoneyInput';
import SelectInput from '../SelectInput';
import style from './style.css';

const messages = defineMessages({
  expense: {
    id: 'component.operationEditForm.expense',
    description: 'Label of expense type button',
    defaultMessage: 'Expense',
  },
  transfer: {
    id: 'component.operationEditForm.transfer',
    description: 'Label of transfer type button',
    defaultMessage: 'Transfer',
  },
  income: {
    id: 'component.operationEditForm.income',
    description: 'Label of income type button',
    defaultMessage: 'Income',
  },
  saveProcessButton: {
    id: 'component.operationEditForm.saveProcessButton',
    description: 'Label of button in process',
    defaultMessage: 'Saving...',
  },
  createButton: {
    id: 'component.operationEditForm.createButton',
    description: 'Label of create button',
    defaultMessage: 'Create',
  },
  saveButton: {
    id: 'component.operationEditForm.saveButton',
    description: 'Label of save button',
    defaultMessage: 'Save',
  },
  deleteButton: {
    id: 'component.operationEditForm.deleteButton',
    description: 'Label of delete button',
    defaultMessage: 'Delete',
  },
  cancelButton: {
    id: 'component.operationEditForm.cancelButton',
    description: 'Label of cancel button',
    defaultMessage: 'Cancel',
  },
  todayButton: {
    id: 'component.operationEditForm.todayButton',
    description: 'Label of today button',
    defaultMessage: 'Today',
  },
  addOperationHeader: {
    id: 'component.operationEditForm.addOperationHeader',
    description: 'Header of form',
    defaultMessage: 'Add new operation',
  },
  editOperationHeader: {
    id: 'component.operationEditForm.editOperationHeader',
    description: 'Header of form',
    defaultMessage: 'Edit operation',
  },
  category: {
    placeholder: {
      id: 'component.operationEditForm.category.placeholder',
      description: 'Placeholder of category selector',
      defaultMessage: 'Select category',
    },
    label: {
      id: 'component.operationEditForm.category.label',
      description: 'Label of category selector',
      defaultMessage: 'Category',
    },
  },
  account: {
    placeholder: {
      id: 'component.operationEditForm.account.placeholder',
      description: 'Placeholder of account selector',
      defaultMessage: 'Select account',
    },
    label: {
      id: 'component.operationEditForm.account.label',
      description: 'Label of account selector',
      defaultMessage: 'Account',
    },
  },
  amount: {
    label: {
      id: 'component.operationEditForm.amount.label',
      description: 'Label of amount input',
      defaultMessage: 'Amount',
    },
  },
  amountFrom: {
    label: {
      id: 'component.operationEditForm.amountFrom.label',
      description: 'Label of amount from input',
      defaultMessage: 'Amount from',
    },
  },
  amountTo: {
    label: {
      id: 'component.operationEditForm.amountTo.label',
      description: 'Label of amount to input',
      defaultMessage: 'Amount to',
    },
  },
  accountFrom: {
    label: {
      id: 'component.operationEditForm.accountFrom.label',
      description: 'Label of account from selector',
      defaultMessage: 'Account from',
    },
    placeholder: {
      id: 'component.operationEditForm.accountFrom.placeholder',
      description: 'Placeholder of account from selector',
      defaultMessage: 'Select account',
    },
  },
  accountTo: {
    label: {
      id: 'component.operationEditForm.accountTo.label',
      description: 'Label of account to selector',
      defaultMessage: 'Account to',
    },
    placeholder: {
      id: 'component.operationEditForm.accountTo.placeholder',
      description: 'Placeholder of account to selector',
      defaultMessage: 'Select account',
    },
  },
});

const SelectFormField = field =>
  <FormGroup color={field.meta.error ? 'danger' : null}>
    <Label>{field.label}</Label>
    <SelectInput
      {...field}
      options={field.options}
      clearable={false}
    />
    {field.meta.touched && field.meta.error && <FormFeedback>{field.meta.error}</FormFeedback>}
  </FormGroup>;

const NumberFormField = field =>
  <FormGroup color={field.meta.error ? 'danger' : null}>
    <Label>{field.label}</Label>
    <InputGroup>
      <MoneyInput {...field} className="form-control" />
      <InputGroupAddon>{field.currency.code}</InputGroupAddon>
    </InputGroup>
    {field.meta.touched && field.meta.error && <FormFeedback>{field.meta.error}</FormFeedback>}
  </FormGroup>;

const TypeFormField = field => {
  const { input } = field;
  const onTypeSelect = (type) => () => input.onChange(type);

  return (
    <ButtonGroup className="btn-group-justified mb-3">
      <Button
        onClick={onTypeSelect('expense')}
        type="button"
        active={input.value === 'expense'}
      >
        <FormattedMessage {...messages.expense} />
      </Button>
      <Button
        onClick={onTypeSelect('transfer')}
        type="button"
        active={input.value === 'transfer'}
        disabled={field.transferDisabled}
      >
        <FormattedMessage {...messages.transfer} />
      </Button>
      <Button
        onClick={onTypeSelect('income')}
        type="button"
        active={input.value === 'income'}
      >
        <FormattedMessage {...messages.income} />
      </Button>
    </ButtonGroup>
  );
};

const defaultValues = {
  account: null,
  accountFrom: null,
  accountTo: null,
  created: moment().utc().format(),
  category: null,
  amount: null,
  amountFrom: null,
  amountTo: null,
  type: 'expense',
};

const formId = 'operationEdit';

class OperationEditForm extends React.Component {
  static propTypes = {
    form: React.PropTypes.object.isRequired,
    intl: React.PropTypes.object.isRequired,
    isNewOperation: React.PropTypes.bool.isRequired,
    operationId: React.PropTypes.string,
    operation: React.PropTypes.object,
    process: React.PropTypes.bool.isRequired,
    addOperation: React.PropTypes.func.isRequired,
    addTransferOperation: React.PropTypes.func.isRequired,
    updateTransferOperation: React.PropTypes.func.isRequired,
    updateOperation: React.PropTypes.func.isRequired,
    removeOperation: React.PropTypes.func.isRequired,
    editOperation: React.PropTypes.func.isRequired,
    toggleOperationDeleteModal: React.PropTypes.func.isRequired,
    locale: React.PropTypes.string.isRequired,
    accountList: React.PropTypes.array.isRequired,
    availableAccountListFrom: React.PropTypes.array.isRequired,
    availableAccountListTo: React.PropTypes.array.isRequired,
    availableCategoryList: React.PropTypes.array.isRequired,
    selectedAccountCurrency: React.PropTypes.object,
    selectedTransferAccountsCurrency: React.PropTypes.object,
    selectedType: React.PropTypes.string,
    selectedCategory: React.PropTypes.string,
    selectedAccount: React.PropTypes.string,
    selectedCreated: React.PropTypes.string,
    selectedTransferAccounts: React.PropTypes.object,
    changeFieldValue: React.PropTypes.func.isRequired,
    batchMode: React.PropTypes.func.isRequired,
  };

  componentDidMount() {
    eventEmitter.on('operation.editOperationItem', this.scrollMe);
  }

  componentWillReceiveProps(nextProps) {
    const {
      availableCategoryList,
      accountList,
      selectedCategory,
      selectedType,
      selectedAccount,
      selectedTransferAccounts,
      operation,
      form,
      changeFieldValue,
    } = nextProps;

    const { operation: currentOperation } = this.props;

    const editOperation = operation && !currentOperation;
    const isNewEditOperation = editOperation
      && currentOperation
      && operation._id !== currentOperation._id;

    if (editOperation || isNewEditOperation) {
      const editOperation = operation.asMutable();

      editOperation.category = editOperation.category._id;
      editOperation.created = moment(editOperation.created).format();

      if (editOperation.transfer) {
        editOperation.accountFrom = editOperation.account._id;
        editOperation.accountTo = editOperation.transfer.account._id;

        editOperation.amountFrom = editOperation.amount;
        editOperation.amountTo = editOperation.transfer.amount;

        delete editOperation.account;
        delete editOperation.amount;
      } else {
        editOperation.account = editOperation.account._id;
      }

      form.initialize(editOperation);

      return;
    }

    if (currentOperation && !operation) {
      this.cleanFields();
    }

    const categoryExist = availableCategoryList.some(({ value }) => value === selectedCategory);

    if (!categoryExist) {
      changeFieldValue(formId, 'category', get(availableCategoryList, '0.value'));
    }

    if (selectedType === 'transfer') {
      if (!selectedTransferAccounts.accountFrom || !selectedTransferAccounts.accountTo) {
        changeFieldValue(formId, 'accountFrom', get(accountList, '0.value'));
        changeFieldValue(formId, 'accountTo', get(accountList, '1.value'));
      }

      if (selectedAccount) {
        changeFieldValue(formId, 'account', null);
      }
    } else {
      if (selectedTransferAccounts.accountFrom || selectedTransferAccounts.accountTo) {
        changeFieldValue(formId, 'accountFrom', null);
        changeFieldValue(formId, 'accountTo', null);
      }

      if (!selectedAccount) {
        changeFieldValue(formId, 'account', get(accountList, '0.value'));
      }
    }
  }

  componentWillUnmount() {
    eventEmitter.off('operation.editOperationItem', this.scrollMe);
  }

  getSubmitButton = () => {
    const { submitting } = this.props.form;
    const { process, isNewOperation } = this.props;
    const disabled = submitting || process;

    let label;

    if (submitting || process) {
      label = <FormattedMessage {...messages.saveProcessButton} />;
    } else if (isNewOperation) {
      label = <FormattedMessage {...messages.createButton} />;
    } else {
      label = <FormattedMessage {...messages.saveButton} />;
    }

    return (<Button type="submit" color="primary" disabled={disabled}>{label}</Button>);
  };

  getDeleteButton = () => {
    const { toggleOperationDeleteModal, operation } = this.props;

    return (
      <Button
        type="button"
        color="danger"
        className="ml-3"
        onClick={() => toggleOperationDeleteModal(operation)}
      >
        <FormattedMessage {...messages.deleteButton} />
      </Button>
    );
  };

  getCancelButton = () => {
    const { editOperation } = this.props;

    return (
      <Button
        type="button"
        className="float-right"
        color="secondary"
        onClick={() => editOperation()}
      >
        <FormattedMessage {...messages.cancelButton} />
      </Button>
    );
  };

  getTodayButton = () => {
    const { selectedCreated } = this.props;

    if (!selectedCreated) {
      return null;
    }

    const selectedDate = moment(selectedCreated).startOf('d').utc();
    const now = moment().startOf('d').utc();
    const isSameDay = now.diff(selectedDate, 'd') === 0;

    if (isSameDay) {
      return null;
    }

    return (
      <Button type="button" size="sm" className="mt-3" block onClick={this.setToday}>
        <FormattedMessage {...messages.todayButton} />
      </Button>
    );
  }

  setToday = () => {
    this.props.changeFieldValue(formId, 'created', moment.utc().format());
  }

  scrollMe = () => {
    this.operationEditForm.scrollIntoView(true, { behavior: 'smooth' });
  }

  cleanFields = () => {
    ['amountFrom', 'amountTo', 'amount'].forEach((fieldName) => {
      this.props.changeFieldValue(formId, fieldName, null);
    });
  }

  submitHandler = (values) => new Promise(async (resolve, reject) => {
    const {
      batchMode,
      addOperation,
      addTransferOperation,
      removeOperation,
      updateOperation,
      updateTransferOperation,
      isNewOperation,
      operation,
    } = this.props;

    const toValidate = omitBy(Object.assign({}, defaultValues, values), val => !val);

    if (toValidate.type === 'expense') {
      toValidate.amount = toNegative(toValidate.amount);
    }

    if (toValidate.type === 'income') {
      toValidate.amount = toPositive(toValidate.amount);
    }

    if (toValidate.type === 'transfer') {
      toValidate.amountFrom = toPositive(toValidate.amountFrom);
      toValidate.amountTo = toPositive(toValidate.amountTo);
    }

    const nowTime = moment().utc();

    toValidate.created = moment(toValidate.created).set({
      hours: nowTime.hours(),
      minutes: nowTime.minutes(),
      seconds: nowTime.seconds(),
    }).format();

    let result;

    try {
      if (isNewOperation) {
        if (toValidate.type === 'transfer') {
          result = await addTransferOperation(toValidate);
        } else {
          result = await addOperation(toValidate);
        }
      } else if (toValidate.type !== operation.type) {
        batchMode(true);

        await removeOperation(operation);

        batchMode(false);

        if (toValidate.type === 'transfer') {
          result = await addTransferOperation(toValidate);
        } else {
          result = await addOperation(toValidate);
        }
      } else if (toValidate.type === 'transfer') {
        result = await updateTransferOperation(toValidate);
      } else {
        result = await updateOperation(toValidate);
      }
    } catch (err) {
      error(err);

      const validationResult =
          mapValues(validationHandler(toValidate, err),
            val => this.props.intl.formatMessage({ id: val }));

      reject(new SubmissionError(validationResult));

      return;
    }

    resolve(result.data);
  }).then(() => {
    const { isNewOperation, editOperation } = this.props;

    if (!isNewOperation) {
      editOperation();
    }

    this.cleanFields();
  });

  render() {
    const {
      locale,
      availableCategoryList,
      accountList,
      availableAccountListFrom,
      availableAccountListTo,
      selectedType,
      selectedAccountCurrency,
      selectedTransferAccountsCurrency,
      isNewOperation,
    } = this.props;

    const { formatMessage } = this.props.intl;
    const { handleSubmit, error: formError } = this.props.form;

    return (
      <div ref={node => { this.operationEditForm = node; }}>
        <Card>
          <CardHeader>
            { isNewOperation
              ? <FormattedMessage {...messages.addOperationHeader} />
              : <FormattedMessage {...messages.editOperationHeader} />
            }
          </CardHeader>
          <CardBlock>
            <Form onSubmit={handleSubmit(this.submitHandler)} noValidate className={style.content}>
              <div className={style.datepicker}>
                <Field
                  name="created"
                  locale={locale}
                  component={DatePicker}
                />

                { this.getTodayButton() }
              </div>
              <div className={classnames(style.form, 'ml-3')}>
                <Field
                  name="type"
                  component={TypeFormField}
                  transferDisabled={accountList.length <= 1}
                />

                {selectedType !== 'transfer' && [
                  <Field
                    key="category"
                    label={formatMessage(messages.category.label)}
                    placeholder={formatMessage(messages.category.placeholder)}
                    name="category"
                    options={availableCategoryList}
                    disabled={availableCategoryList.length === 1}
                    component={SelectFormField}
                    optionRenderer={optionRenderer()}
                    valueRenderer={valueRenderer()}
                  />,
                  <Field
                    key="account"
                    label={formatMessage(messages.account.label)}
                    placeholder={formatMessage(messages.account.placeholder)}
                    name="account"
                    options={accountList}
                    component={SelectFormField}
                    disabled={accountList.length === 1}
                  />,
                  <Field
                    key="amount"
                    name="amount"
                    label={formatMessage(messages.amount.label)}
                    component={NumberFormField}
                    currency={selectedAccountCurrency}
                    type="number"
                  />,
                ]}

                {selectedType === 'transfer' && [
                  <Field
                    key="accountFrom"
                    label={formatMessage(messages.accountFrom.label)}
                    placeholder={formatMessage(messages.accountFrom.placeholder)}
                    name="accountFrom"
                    options={availableAccountListFrom}
                    component={SelectFormField}
                  />,
                  <Field
                    key="accountTo"
                    label={formatMessage(messages.accountTo.label)}
                    placeholder={formatMessage(messages.accountTo.placeholder)}
                    name="accountTo"
                    options={availableAccountListTo}
                    component={SelectFormField}
                  />,
                  <Field
                    key="amountFrom"
                    name="amountFrom"
                    label={formatMessage(messages.amountFrom.label)}
                    component={NumberFormField}
                    currency={selectedTransferAccountsCurrency.accountFrom}
                    type="number"
                  />,
                  <Field
                    key="amountTo"
                    name="amountTo"
                    label={formatMessage(messages.amountTo.label)}
                    component={NumberFormField}
                    currency={selectedTransferAccountsCurrency.accountTo}
                    type="number"
                  />,
                ]}

                { formError && <Alert color="danger">{formError}</Alert> }

                <div>
                  { this.getSubmitButton() }
                  { !isNewOperation && this.getDeleteButton() }
                  { !isNewOperation && this.getCancelButton() }
                </div>
              </div>
            </Form>
          </CardBlock>
        </Card>
      </div>
    );
  }
}

let operationForm = reduxForm({
  form: formId,
  propNamespace: 'form',
})(OperationEditForm);

const mapDispatchToProps = dispatch => ({
  addOperation: (...args) => dispatch(operationActions.add(...args)),
  removeOperation: (...args) => dispatch(operationActions.remove(...args)),
  updateOperation: (...args) => dispatch(operationActions.update(...args)),
  addTransferOperation: (...args) => dispatch(operationActions.addTransfer(...args)),
  updateTransferOperation: (...args) => dispatch(operationActions.updateTransfer(...args)),
  batchMode: (...args) => dispatch(operationActions.batchMode(...args)),
  changeFieldValue: (...args) => dispatch(change(...args)),
});

const formFieldSelector = formValueSelector('operationEdit');

const processSelector = createSelector(
  state => get(state, 'account.process', false),
  process => process,
);

const localeSelector = createSelector(
  state => get(state, 'locale.currentLocale', config.defaultLocale),
  locale => locale,
);

const accountListSelector = createSelector(
  state => get(state, 'account.accounts', []),
  accountList => accountList.map(account => ({ value: account._id, label: account.name }))
);

const operationSelector = createSelector(
  (_, props) => props.operation,
  operation => operation
);

const isNewOperationSelector = createSelector(
  operationSelector,
  operation => isUndefined(operation),
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

const selectedTypeSelector = createSelector(
  state => formFieldSelector(state, 'type'),
  currentType => currentType
);

const selectedCreatedSelector = createSelector(
  state => formFieldSelector(state, 'created'),
  currentDate => currentDate
);

const selectedCategorySelector = createSelector(
  state => formFieldSelector(state, 'category'),
  currentCategory => currentCategory
);

const selectedAccountSelector = createSelector(
  state => formFieldSelector(state, 'account'),
  account => account
);

const selectedTransferAccountsSelector = createSelector(
  state => formFieldSelector(state, 'accountFrom', 'accountTo'),
  accounts => accounts
);

const availableAccountListFromSelector = createSelector(
  selectedTransferAccountsSelector,
  accountListSelector,
  ({ accountTo }, accountList) =>
    accountList.filter(account => account.value !== accountTo)
);

const availableAccountListToSelector = createSelector(
  selectedTransferAccountsSelector,
  accountListSelector,
  ({ accountFrom }, accountList) =>
    accountList.filter(account => account.value !== accountFrom)
);

const availableCategoryListSelector = createSelector(
  selectedTypeSelector,
  categoryListSelector,
  (type, categoryList) => {
    let availableCategoryList;

    if (type === 'transfer') {
      availableCategoryList = categoryList.filter(({ model }) => model.transfer);
    } else {
      availableCategoryList = categoryList
        .filter(node =>
          (node.model.type === 'any' || node.model.type === type)
          && !node.isRoot()
          && !node.model.transfer);
    }

    return availableCategoryList.map(node => ({
      value: node.model._id,
      label: node.model.name,
      node,
    }));
  }
);

const initialValuesSelector = createSelector(
  isNewOperationSelector,
  (_, props) => props.operation,
  availableCategoryListSelector,
  accountListSelector,
  selectedTypeSelector,
  (isNewOperation, operation, availableCategoryList, accountList, selectedType) => {
    if (isNewOperation) {
      const newOperation = Object.assign({}, defaultValues);

      if (selectedType === 'transfer') {
        newOperation.accountFrom = get(availableCategoryList, '0.value');
        newOperation.accountTo = get(accountList, '1.value');
      } else {
        newOperation.category = get(availableCategoryList, '0.value');
        newOperation.account = get(accountList, '0.value');
      }

      return newOperation;
    }

    return undefined;
  }
);

const selectedAccountCurrencySelector = createSelector(
  selectedAccountSelector,
  state => state.currency.currencyList,
  state => state.account.accounts,
  (selectedAccount, currencyList, accountList) => {
    if (!selectedAccount) {
      return currencyList[0];
    }

    const account = accountList.find(({ _id }) => _id === selectedAccount);
    const selectedCurrency = currencyList.find(({ _id }) => _id === account.currency);

    return selectedCurrency;
  },
);

const selectedTransferAccountsCurrencySelector = createSelector(
  selectedTransferAccountsSelector,
  state => state.currency.currencyList,
  state => state.account.accounts,
  ({ accountFrom, accountTo }, currencyList, accountList) => {
    if (!accountFrom || !accountTo) {
      return { accountFrom: currencyList[0], accountTo: currencyList[0] };
    }

    const accounts = accountList.reduce((acc, account) => {
      if (account._id === accountFrom) {
        acc.accountFrom = account;
      }

      if (account._id === accountTo) {
        acc.accountTo = account;
      }

      return acc;
    }, {});

    return currencyList.reduce((acc, currency) => {
      if (currency._id === accounts.accountFrom.currency) {
        acc.accountFrom = currency;
      }

      if (currency._id === accounts.accountTo.currency) {
        acc.accountTo = currency;
      }

      return acc;
    }, {});
  },
);

const selector = createSelector(
  localeSelector,
  processSelector,
  accountListSelector,
  availableCategoryListSelector,
  initialValuesSelector,
  isNewOperationSelector,
  selectedAccountCurrencySelector,
  selectedTransferAccountsCurrencySelector,
  selectedTypeSelector,
  selectedCategorySelector,
  selectedAccountSelector,
  selectedCreatedSelector,
  selectedTransferAccountsSelector,
  availableAccountListFromSelector,
  availableAccountListToSelector,
  (
    locale,
    process,
    accountList,
    availableCategoryList,
    initialValues,
    isNewOperation,
    selectedAccountCurrency,
    selectedTransferAccountsCurrency,
    selectedType,
    selectedCategory,
    selectedAccount,
    selectedCreated,
    selectedTransferAccounts,
    availableAccountListFrom,
    availableAccountListTo
  ) => ({
    locale,
    process,
    accountList,
    availableCategoryList,
    initialValues,
    isNewOperation,
    selectedAccountCurrency,
    selectedTransferAccountsCurrency,
    selectedType,
    selectedCategory,
    selectedAccount,
    selectedCreated,
    selectedTransferAccounts,
    availableAccountListFrom,
    availableAccountListTo,
  })
);

operationForm = connect(selector, mapDispatchToProps)(operationForm);

export default injectIntl(operationForm, { withRef: true });
