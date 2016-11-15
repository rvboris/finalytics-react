import React from 'react';
import { connect } from 'react-redux';
import { createSelector } from 'reselect';
import { reduxForm, Field, formValueSelector } from 'redux-form';
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
} from 'reactstrap';

import config from '../../config';
import { operationActions } from '../../actions';
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
  created: moment.utc().toString(),
  category: null,
  amount: null,
};

const fieldsToEdit = Object.keys(defaultValues);

class OperationEditForm extends React.Component {
  static propTypes = {
    operationId: React.PropTypes.string,
    process: React.PropTypes.bool.isRequired,
    isNewOperation: React.PropTypes.bool.isRequired,
    form: React.PropTypes.object.isRequired,
    intl: React.PropTypes.object.isRequired,
    createOperation: React.PropTypes.func.isRequired,
    saveOperation: React.PropTypes.func.isRequired,
    removeOperation: React.PropTypes.func.isRequired,
    locale: React.PropTypes.string.isRequired,
    mode: React.PropTypes.string.isRequired,
    accountList: React.PropTypes.array.isRequired,
    categoryList: React.PropTypes.array.isRequired,
    selectedAccountCurrency: React.PropTypes.object,
  };

  constructor(props) {
    super(props);

    this.state = {
      mode: props.mode,
    };
  }

  getCategoriesList(mode) {
    if (!['expense', 'income'].includes(mode)) {
      return [];
    }

    const getNodeLabel = node => `${'- - '.repeat(node.getPath().length - 1)} ${node.model.name}`;

    const categoryList = this.props.categoryList
      .filter(node => node.model.type === node.model.type === 'any' || node.model.type === mode);

    return categoryList.map(node => ({ value: node.model._id, label: getNodeLabel(node) }));
  }

  getAccountsList() {
    return this.props.accountList.map(account => ({ value: account._id, label: account.name }));
  }

  toggleMode(mode) {
    this.setState(Object.assign({}, this.state, { mode }));
  }

  render() {
    const { locale } = this.props;
    const { mode } = this.state;

    const categoriesList = this.getCategoriesList(mode);
    const accountsList = this.getAccountsList();

    return (
      <Card>
        <CardHeader>Добавить операцию</CardHeader>
        <CardBlock>
          <Form className={style['content-container']}>
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
                  onClick={() => this.toggleMode('expense')}
                  color="primary"
                  type="button"
                  outline
                  active={mode === 'expense'}
                >
                  Расход
                </Button>
                <Button
                  onClick={() => this.toggleMode('transfer')}
                  color="primary"
                  type="button"
                  outline
                  active={mode === 'transfer'}
                >
                  Перевод
                </Button>
                <Button
                  onClick={() => this.toggleMode('income')}
                  color="primary"
                  type="button"
                  outline
                  active={mode === 'income'}
                >
                  Доход
                </Button>
              </ButtonGroup>

              {['expense', 'income'].includes(mode) && [
                <Field
                  label="Категория"
                  placeholder="Выбрать категорию"
                  name="category"
                  options={categoriesList}
                  component={SelectFormField}
                />,
                <Field
                  label="Счет"
                  placeholder="Выбрать счет"
                  name="account"
                  options={accountsList}
                  component={SelectFormField}
                  disabled={accountsList.length === 1}
                />,
                <Field
                  name="amount"
                  label="Сумма"
                  component={NumberFormField}
                  currency={this.props.selectedAccountCurrency}
                  type="number"
                />,
              ]}

              {this.state.mode === 'transfer' && [
                <Field
                  label="Счет откуда"
                  placeholder="Выбрать счет"
                  name="accountFrom"
                  options={accountsList}
                  component={SelectFormField}
                />,
                <Field
                  label="Счет куда"
                  placeholder="Выбрать счет"
                  name="accountTo"
                  options={accountsList}
                  component={SelectFormField}
                />,
                <Field
                  name="amount"
                  label="Сумма ушла"
                  component={NumberFormField}
                  currency={this.props.selectedAccountCurrency}
                  type="number"
                />,
                <Field
                  name="amount"
                  label="Сумма пришла"
                  component={NumberFormField}
                  currency={this.props.selectedAccountCurrency}
                  type="number"
                />,
              ]}
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
  saveOperation: (...args) => dispatch(operationActions.save(...args)),
  createOperation: (...args) => dispatch(operationActions.create(...args)),
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

const initialModeSelector = createSelector(
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
  initialModeSelector,
  selectedAccountCurrencySelector,
  (
    locale,
    process,
    accountList,
    categoryList,
    initialValues,
    isNewOperation,
    mode,
    selectedAccountCurrency
  ) => ({
    locale,
    process,
    accountList,
    categoryList,
    initialValues,
    isNewOperation,
    mode,
    selectedAccountCurrency,
  })
);

operationForm = connect(selector, mapDispatchToProps)(operationForm);

export default injectIntl(operationForm);
