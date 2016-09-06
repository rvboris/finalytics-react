import React from 'react';
import { connect } from 'react-redux';
import { createSelector } from 'reselect';
import accounting from 'accounting';

const MoneyFormat = (props) => {
  const formatOptions = { format: '%v %s' };

  if (props.currency) {
    formatOptions.symbol = props.currency.code;
  }

  return (<span>{accounting.formatMoney(props.sum, formatOptions)}</span>);
};

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
