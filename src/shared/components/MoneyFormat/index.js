import React from 'react';
import { connect } from 'react-redux';
import { createSelector } from 'reselect';
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

const selector = createSelector(
  state => state.currency.currencyList,
  (_, props) => props.currencyId,
  state => state.currency.process,
  (currencyList, currencyId, process) => ({
    currency: (currencyList || []).find((currency) => currency._id === currencyId),
    process,
  }),
);

export default connect(selector)(MoneyFormat);
