import React from 'react';
import { connect } from 'react-redux';
import { createSelector } from 'reselect';
import { reduxForm, Field, formValueSelector, SubmissionError, change } from 'redux-form';
import { get, isUndefined, omitBy, mapValues } from 'lodash';
import { injectIntl } from 'react-intl';
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
import validationHandler from '../../utils/validation-handler';
import { toNegative, toPositive } from '../../utils/money-input';
import { optionRenderer, valueRenderer } from '../../utils/category-select';
import { operationActions } from '../../actions';
import { error } from '../../log';
import DatePicker from '../DatePicker';
import MoneyInput from '../MoneyInput';
import SelectInput from '../SelectInput';
import style from './style.css';

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

  return (
    <ButtonGroup className="btn-group-justified mb-1">
      <Button
        onClick={() => input.onChange('expense')}
        color="primary"
        type="button"
        outline
        active={input.value === 'expense'}
      >
        Расход
      </Button>
      <Button
        onClick={() => input.onChange('transfer')}
        color="primary"
        type="button"
        outline
        active={input.value === 'transfer'}
        disabled={field.transferDisabled}
      >
        Перевод
      </Button>
      <Button
        onClick={() => input.onChange('income')}
        color="primary"
        type="button"
        outline
        active={input.value === 'income'}
      >
        Доход
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
    operationId: React.PropTypes.string,
    process: React.PropTypes.bool.isRequired,
    isNewOperation: React.PropTypes.bool.isRequired,
    form: React.PropTypes.object.isRequired,
    intl: React.PropTypes.object.isRequired,
    addOperation: React.PropTypes.func.isRequired,
    addTransferOperation: React.PropTypes.func.isRequired,
    updateOperation: React.PropTypes.func.isRequired,
    removeOperation: React.PropTypes.func.isRequired,
    locale: React.PropTypes.string.isRequired,
    accountList: React.PropTypes.array.isRequired,
    availableAccountListFrom: React.PropTypes.array.isRequired,
    availableAccountListTo: React.PropTypes.array.isRequired,
    availableCategoryList: React.PropTypes.array.isRequired,
    selectedAccountCurrency: React.PropTypes.object,
    selectedType: React.PropTypes.string,
    selectedCategory: React.PropTypes.string,
    selectedAccount: React.PropTypes.string,
    selectedTransferAccounts: React.PropTypes.object,
    changeFieldValue: React.PropTypes.func.isRequired,
  };

  componentWillReceiveProps(nextProps) {
    const {
      availableCategoryList,
      accountList,
      selectedCategory,
      selectedType,
      selectedAccount,
      selectedTransferAccounts,
    } = nextProps;

    const categoryExist = availableCategoryList
      .some(category => category.value === selectedCategory);

    if (!categoryExist) {
      nextProps.changeFieldValue(formId, 'category', availableCategoryList[0].value);
    }

    if (selectedType === 'transfer') {
      if (!selectedTransferAccounts.accountFrom || !selectedTransferAccounts.accountTo) {
        nextProps.changeFieldValue(formId, 'accountFrom', accountList[0].value);
        nextProps.changeFieldValue(formId, 'accountTo', accountList[1].value);
      }

      if (selectedAccount) {
        nextProps.changeFieldValue(formId, 'account', null);
      }
    } else {
      if (selectedTransferAccounts.accountFrom || selectedTransferAccounts.accountTo) {
        nextProps.changeFieldValue(formId, 'accountFrom', null);
        nextProps.changeFieldValue(formId, 'accountTo', null);
      }

      if (!selectedAccount) {
        nextProps.changeFieldValue(formId, 'account', accountList[0].value);
      }
    }
  }

  getSubmitButton = () => {
    const { submitting } = this.props.form;
    const disabled = submitting || this.props.process;

    let label;

    if (submitting || this.props.process) {
      label = 'Сохранение';
    } else if (this.props.isNewOperation) {
      label = 'Создать';
    } else {
      label = 'Сохранить';
    }

    return (<Button type="submit" color="primary" disabled={disabled}>{label}</Button>);
  };

  submitHandler = (values) => new Promise(async (resolve, reject) => {
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

    console.log(toValidate);

    let result;

    try {
      if (this.props.isNewOperation) {
        if (toValidate.type === 'transfer') {
          result = await this.props.addTransferOperation(toValidate);
        } else {
          result = await this.props.addOperation(toValidate);
        }
      } else {
        // Update, Remove
      }
    } catch (err) {
      error(err);

      const validationResult =
          mapValues(validationHandler(toValidate, err),
            val => this.props.intl.formatMessage({ id: val }));

      reject(new SubmissionError(validationResult));

      return;
    }

    resolve(result);
  }).then((operation) => {
    const { changeFieldValue } = this.props;

    if (operation.type === 'transfer') {
      changeFieldValue(formId, 'amountFrom', null);
      changeFieldValue(formId, 'amountTo', null);
    } else {
      changeFieldValue(formId, 'amount', null);
    }

    console.log(operation);
  });

  render() {
    const {
      locale,
      availableCategoryList,
      accountList,
      availableAccountListFrom,
      availableAccountListTo,
      selectedType,
    } = this.props;

    const { handleSubmit, error: formError } = this.props.form;

    return (
      <Card>
        <CardHeader>Добавить операцию</CardHeader>
        <CardBlock>
          <Form onSubmit={handleSubmit(this.submitHandler)} noValidate className={style['content-container']}>
            <div className={style['datepicker-container']}>
              <Field
                name="created"
                locale={locale}
                component={DatePicker}
              />
            </div>
            <div className={classnames(style['form-container'], 'ml-1')}>
              <Field
                name="type"
                component={TypeFormField}
                transferDisabled={accountList.length <= 1}
              />

              {selectedType !== 'transfer' && [
                <Field
                  key="category"
                  label="Категория"
                  placeholder="Выбрать категорию"
                  name="category"
                  options={availableCategoryList}
                  disabled={availableCategoryList.length === 1}
                  component={SelectFormField}
                  optionRenderer={optionRenderer()}
                  valueRenderer={valueRenderer()}
                  virtualized={false}
                />,
                <Field
                  key="account"
                  label="Счет"
                  placeholder="Выбрать счет"
                  name="account"
                  options={accountList}
                  component={SelectFormField}
                  disabled={accountList.length === 1}
                />,
                <Field
                  key="amount"
                  name="amount"
                  label="Сумма"
                  component={NumberFormField}
                  currency={this.props.selectedAccountCurrency}
                  type="number"
                />,
              ]}

              {selectedType === 'transfer' && [
                <Field
                  key="accountFrom"
                  label="Счет откуда"
                  placeholder="Выбрать счет"
                  name="accountFrom"
                  options={availableAccountListFrom}
                  component={SelectFormField}
                />,
                <Field
                  key="accountTo"
                  label="Счет куда"
                  placeholder="Выбрать счет"
                  name="accountTo"
                  options={availableAccountListTo}
                  component={SelectFormField}
                />,
                <Field
                  key="amountFrom"
                  name="amountFrom"
                  label="Сумма ушла"
                  component={NumberFormField}
                  currency={this.props.selectedAccountCurrency}
                  type="number"
                />,
                <Field
                  key="amountTo"
                  name="amountTo"
                  label="Сумма пришла"
                  component={NumberFormField}
                  currency={this.props.selectedAccountCurrency}
                  type="number"
                />,
              ]}

              { formError && <Alert color="danger">{formError}</Alert> }

              <div>
                { this.getSubmitButton() }
              </div>
            </div>
          </Form>
        </CardBlock>
      </Card>
    );
  }
}

let operationForm = reduxForm({
  form: formId,
  propNamespace: 'form',
})(OperationEditForm);

const mapDispatchToProps = dispatch => ({
  updateOperation: (...args) => dispatch(operationActions.update(...args)),
  addOperation: (...args) => dispatch(operationActions.add(...args)),
  addTransferOperation: (...args) => dispatch(operationActions.addTransfer(...args)),
  removeOperation: (...args) => dispatch(operationActions.remove(...args)),
  changeFieldValue: (...args) => dispatch(change(...args)),
});

const formFieldSelector = formValueSelector('operationEdit');

const processSelector = createSelector(
  state => state.account.process,
  process => process,
);

const localeSelector = createSelector(
  state => get(state, 'auth.profile.settings.locale', config.defaultLang),
  locale => locale,
);

const accountListSelector = createSelector(
  state => state.account.accounts,
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
  state => state.category.data,
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
      availableCategoryList = categoryList.filter(node => node.model.transfer);
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
    const newOperation = Object.assign({}, defaultValues);

    if (isNewOperation) {
      if (selectedType === 'transfer') {
        newOperation.accountFrom = get(availableCategoryList, '0.value');
        newOperation.accountTo = get(accountList, '1.value');
      } else {
        newOperation.category = get(availableCategoryList, '0.value');
        newOperation.account = get(accountList, '0.value');
      }

      return newOperation;
    }

    return operation;
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

    const account = accountList.find(account => account._id === selectedAccount);
    const selectedCurrency = currencyList.find(currency => currency._id === account.currency);

    return selectedCurrency;
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
  selectedTypeSelector,
  selectedCategorySelector,
  selectedAccountSelector,
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
    selectedType,
    selectedCategory,
    selectedAccount,
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
    selectedType,
    selectedCategory,
    selectedAccount,
    selectedTransferAccounts,
    availableAccountListFrom,
    availableAccountListTo,
  })
);

operationForm = connect(selector, mapDispatchToProps)(operationForm);

export default injectIntl(operationForm);
