import React from 'react';
import { connect } from 'react-redux';
import { createSelector } from 'reselect';
import { get } from 'lodash';

import MoneyFormat from '../MoneyFormat';

const BalanceTotal = ({ total, currencyId }) => (
  <MoneyFormat sum={total} currencyId={currencyId} />
);

BalanceTotal.propTypes = {
  total: React.PropTypes.number.isRequired,
  currencyId: React.PropTypes.string.isRequired,
};

const processSelector = createSelector(
  state => get(state, 'balance.process', false),
  process => process,
);

const totalSelector = createSelector(
  state => get(state, 'balance.total', 0),
  total => total,
);

const currencySelector = createSelector(
  state => get(state, 'balance.currency'),
  currency => currency,
);

const selector = createSelector(
  totalSelector,
  currencySelector,
  processSelector,
  (total, currencyId, process) => ({
    total,
    currencyId,
    process,
  }),
);

export default connect(selector)(BalanceTotal);
