import React from 'react';
import { connect } from 'react-redux';
import { createSelector } from 'reselect';
import { reduxForm, Field, formValueSelector, SubmissionError } from 'redux-form';
import { get, isUndefined } from 'lodash';
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

const defaultValues = {
  account: null,
  accountFrom: null,
  accountTo: null,
  created: moment().utc().format(),
  category: null,
  amount: null,
  type: null,
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
    initialType: React.PropTypes.string.isRequired,
    accountList: React.PropTypes.array.isRequired,
    categoryList: React.PropTypes.array.isRequired,
    selectedAccountCurrency: React.PropTypes.object,
  };

  constructor(props) {
    super(props);

    this.state = {
      type: props.initialType,
    };
  }

  getCategoryList(type) {
    if (!['expense', 'income'].includes(type)) {
      return [];
    }

    const categoryList = this.props.categoryList
      .filter(node => (node.model.type === 'any' || node.model.type === type) && !node.isRoot());

    return categoryList.map(node => ({
      value: node.model._id,
      label: node.model.name,
      node,
    }));
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

  getAccountList() {
    return this.props.accountList.map(account => ({ value: account._id, label: account.name }));
  }

  toggleType(type) {
    this.setState(Object.assign({}, this.state, { type }));
  }

  submitHandler = (values) => new Promise(async (resolve, reject) => {
    const toValidate = Object.assign({}, defaultValues, values);

    toValidate.type = this.state.type;

    if (toValidate.type === 'expense') {
      toValidate.amount = toNegative(toValidate.amount);
    }

    if (toValidate.type === 'income') {
      toValidate.amount = toPositive(toValidate.amount);
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

      reject(new SubmissionError());

      return;
    }

    resolve(result);
  }).then(() => {
    // Highlight operation
  });

  render() {
    const { locale } = this.props;
    const { type } = this.state;

    const categoryList = this.getCategoryList(type);
    const accountList = this.getAccountList();

    const { handleSubmit, error: formError } = this.props.form;

    return (
      <Card>
        <CardHeader>
          <span>Добавить операцию</span>
          <Button className="float-xs-right" size="sm">
            Категории
          </Button>
        </CardHeader>
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
              <ButtonGroup className="btn-group-justified mb-1">
                <Button
                  onClick={() => this.toggleType('expense')}
                  color="primary"
                  type="button"
                  outline
                  active={type === 'expense'}
                >
                  Расход
                </Button>
                <Button
                  onClick={() => this.toggleType('transfer')}
                  color="primary"
                  type="button"
                  outline
                  active={type === 'transfer'}
                >
                  Перевод
                </Button>
                <Button
                  onClick={() => this.toggleType('income')}
                  color="primary"
                  type="button"
                  outline
                  active={type === 'income'}
                >
                  Доход
                </Button>
              </ButtonGroup>

              {['expense', 'income'].includes(type) && [
                <Field
                  key="category"
                  label="Категория"
                  placeholder="Выбрать категорию"
                  name="category"
                  options={categoryList}
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

              {this.state.type === 'transfer' && [
                <Field
                  key="accountFrom"
                  label="Счет откуда"
                  placeholder="Выбрать счет"
                  name="accountFrom"
                  options={accountList}
                  component={SelectFormField}
                />,
                <Field
                  key="accountTo"
                  label="Счет куда"
                  placeholder="Выбрать счет"
                  name="accountTo"
                  options={accountList}
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
})(OperationEditForm);

const mapDispatchToProps = dispatch => ({
  updateOperation: (...args) => dispatch(operationActions.update(...args)),
  addOperation: (...args) => dispatch(operationActions.add(...args)),
  removeOperation: (...args) => dispatch(operationActions.remove(...args)),
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
  accountList => accountList
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
        defaultValues.account = accountList[0]._id;
      }

      return defaultValues;
    }

    return operation;
  }
);

const initialTypeSelector = createSelector(
  isNewOperationSelector,
  operationDefaultsSelector,
  (isNewOperation, operation) => {
    if (isNewOperation) {
      return 'expense';
    }

    return operation.type;
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

const selectedAccountCurrencySelector = createSelector(
  operationDefaultsSelector,
  state => formFieldSelector(state, ...fieldsToEdit),
  state => state.currency.currencyList,
  accountListSelector,
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
  categoryListSelector,
  operationDefaultsSelector,
  isNewOperationSelector,
  initialTypeSelector,
  selectedAccountCurrencySelector,
  (
    locale,
    process,
    accountList,
    categoryList,
    initialValues,
    isNewOperation,
    initialType,
    selectedAccountCurrency
  ) => ({
    locale,
    process,
    accountList,
    categoryList,
    initialValues,
    isNewOperation,
    initialType,
    selectedAccountCurrency,
  })
);

operationForm = connect(selector, mapDispatchToProps)(operationForm);

export default injectIntl(operationForm);
