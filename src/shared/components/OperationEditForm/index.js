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

const fieldsToEdit = Object.keys(defaultValues);

class OperationEditForm extends React.Component {
  static propTypes = {
    operationId: React.PropTypes.string,
    process: React.PropTypes.bool.isRequired,
    isNewOperation: React.PropTypes.bool.isRequired,
    form: React.PropTypes.object.isRequired,
    intl: React.PropTypes.object.isRequired,
    addOperation: React.PropTypes.func.isRequired,
    updateOperation: React.PropTypes.func.isRequired,
    removeOperation: React.PropTypes.func.isRequired,
    locale: React.PropTypes.string.isRequired,
    accountList: React.PropTypes.array.isRequired,
    availableCategoryList: React.PropTypes.array.isRequired,
    selectedAccountCurrency: React.PropTypes.object,
    selectedType: React.PropTypes.string.isRequired,
    selectedCategory: React.PropTypes.string.isRequired,
    availableAccountListFrom: React.PropTypes.array.isRequired,
    availableAccountListTo: React.PropTypes.array.isRequired,
    selectedTransferAccounts: React.PropTypes.object.isRequired,
  };

  componentWillReceiveProps(nextProps) {
    const {
      availableCategoryList,
      accountList,
      selectedCategory,
      selectedType,
      selectedTransferAccounts,
    } = nextProps;

    const categoryExist = availableCategoryList
      .some(category => category.value === selectedCategory);

    if (!categoryExist) {
      nextProps.changeFieldValue('operationEdit', 'category', availableCategoryList[0].value);
    }

    if (selectedType === 'transfer'
      && (!selectedTransferAccounts.accountFrom || !selectedTransferAccounts.accountTo)) {
      nextProps.changeFieldValue('operationEdit', 'accountFrom', accountList[0].value);
      nextProps.changeFieldValue('operationEdit', 'accountTo', accountList[1].value);
    }

    if (selectedType !== 'transfer'
      && (selectedTransferAccounts.accountFrom || selectedTransferAccounts.accountTo)) {
      nextProps.changeFieldValue('operationEdit', 'accountFrom', null);
      nextProps.changeFieldValue('operationEdit', 'accountTo', null);
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
    console.log(values);
    const toValidate = omitBy(Object.assign({}, defaultValues, values), val => !val);

    if (toValidate.type === 'expense') {
      toValidate.amount = toNegative(toValidate.amount);
    }

    if (toValidate.type === 'income') {
      toValidate.amount = toPositive(toValidate.amount);
    }

    if (toValidate.type === 'transfer') {
      toValidate.amountFrom = toNegative(toValidate.amountFrom);
      toValidate.amountTo = toPositive(toValidate.amountFrom);
    }

    let result;

    console.log(toValidate);

    try {
      if (this.props.isNewOperation) {
        result = await this.props.addOperation(toValidate);
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
    console.log(operation);
  });

  render() {
    const {
      locale,
      availableCategoryList,
      accountList,
      selectedType,
      availableAccountListFrom,
      availableAccountListTo,
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
  form: 'operationEdit',
  propNamespace: 'form',
  enableReinitialize: true,
  fields: Object.keys(defaultValues),
})(OperationEditForm);

const mapDispatchToProps = dispatch => ({
  updateOperation: (...args) => dispatch(operationActions.update(...args)),
  addOperation: (...args) => dispatch(operationActions.add(...args)),
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

const operationDefaultsSelector = createSelector(
  isNewOperationSelector,
  operationSelector,
  accountListSelector,
  (isNewOperation, operation, accountList) => {
    if (isNewOperation) {
      if (accountList.length) {
        defaultValues.account = accountList[0].value;
      }

      return defaultValues;
    }

    return operation;
  }
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
  operationDefaultsSelector,
  state => formFieldSelector(state, 'type'),
  ({ type: defaultType }, currentType) => currentType || defaultType
);

const selectedCategorySelector = createSelector(
  operationDefaultsSelector,
  state => formFieldSelector(state, 'category'),
  ({ category: defaultCategory }, currentCategory) => currentCategory || defaultCategory
);

const selectedTransferAccountsSelector = createSelector(
  state => formFieldSelector(state, 'accountFrom', 'accountTo'),
  (accounts) => accounts
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
  operationDefaultsSelector,
  availableCategoryListSelector,
  (operation, availableCategoryList) => {
    operation.category = get(availableCategoryList, '0.value', operation.category);

    return operation;
  }
);

const selectedAccountCurrencySelector = createSelector(
  operationDefaultsSelector,
  state => formFieldSelector(state, ...fieldsToEdit),
  state => state.currency.currencyList,
  state => state.account.accounts,
  (initialValues, currentValues, currencyList, accountList) => {
    const values = Object.assign({}, initialValues, currentValues);
    const account = accountList.find(account => account._id === values.account);
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
    selectedTransferAccounts,
    availableAccountListFrom,
    availableAccountListTo,
  })
);

operationForm = connect(selector, mapDispatchToProps)(operationForm);

export default injectIntl(operationForm);
