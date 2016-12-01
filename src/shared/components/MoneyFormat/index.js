import React from 'react';
import { connect } from 'react-redux';
import { createSelector } from 'reselect';
import { memoize } from 'lodash';
import accounting from 'accounting';

export const format = (num, currency) => {
  const formatOptions = { format: '%v %s' };

  if (currency) {
    formatOptions.symbol = currency.symbol;
  }

  return accounting.formatMoney(num, formatOptions);
};

const MoneyFormat = (props) => (<span>{format(props.sum, props.currency)}</span>);

MoneyFormat.propTypes = {
  sum: React.PropTypes.number.isRequired,
  currency: React.PropTypes.object,
  currencyId: React.PropTypes.string.isRequired,
};

const getMemoizeCurrencyFind = (currencyList) => memoize(
  currencyId => currencyList.find(({ _id }) => currencyId === _id),
  currencyId => currencyId,
);

let memoizeCurrencyFind;

const currencySelector = createSelector(
  state => state.currency.currencyList,
  (_, props) => props.currencyId,
  (currencyList = [], currencyId) => {
    if (!currencyList.length) {
      return undefined;
    }

    if (!memoizeCurrencyFind) {
      memoizeCurrencyFind = getMemoizeCurrencyFind(currencyList);
    }

    return memoizeCurrencyFind(currencyId);
  }
);

const processSelector = createSelector(
  state => state.currency.process,
  process => process
);

const selector = createSelector(
  currencySelector,
  processSelector,
  (currency, process) => ({
    currency,
    process,
  }),
);

export default connect(selector)(MoneyFormat);
