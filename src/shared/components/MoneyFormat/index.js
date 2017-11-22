import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';
import { createSelector } from 'reselect';
import { memoize, get } from 'lodash';
import accounting from 'accounting';

export const format = (num, currency) => {
  const formatOptions = { format: '%v %s' };

  if (currency) {
    formatOptions.symbol = currency.symbol;
  }

  return accounting.formatMoney(num, formatOptions);
};

const MoneyFormat = ({ sum, currency }) => (<span>{format(sum, currency)}</span>);

MoneyFormat.propTypes = {
  sum: PropTypes.number.isRequired,
  currency: PropTypes.object,
  currencyId: PropTypes.string.isRequired,
};

MoneyFormat.defaultProps = {
  currency: null,
};

const getMemoizeCurrencyFind = (currencyList) => memoize(
  currencyId => currencyList.find(({ _id }) => currencyId === _id),
  currencyId => currencyId,
);

let memoizeCurrencyFind;

const currencySelector = createSelector(
  state => get(state, 'currency.currencyList', []),
  (_, { currencyId }) => currencyId,
  (currencyList, currencyId) => {
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
  state => get(state, 'currency.process', false),
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
