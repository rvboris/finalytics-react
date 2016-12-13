import React from 'react';
import { get } from 'lodash';
import { connect } from 'react-redux';
import { createSelector } from 'reselect';
import { defineMessages, injectIntl, FormattedMessage } from 'react-intl';
import { Card, CardHeader, CardBlock } from 'reactstrap';

import MoneyFormat from '../MoneyFormat';

const messages = defineMessages({
  accounts: {
    id: 'component.accountList.accounts',
    description: 'AccountList panel title',
    defaultMessage: 'Accounts',
  },
  noAccounts: {
    id: 'component.accountList.noAccounts',
    description: 'Empty account list message',
    defaultMessage: 'You have no accounts',
  },
});

const AccountList = (props) => (
  <Card>
    <CardHeader><FormattedMessage {...messages.accounts} /></CardHeader>
    { props.accounts.length
    ? <ul className="list-group list-group-flush">
      {props.accounts.map((account) => (
        <li className="list-group-item clearfix" key={account._id}>
          <span className="float-xs-left">{account.name}</span>
          <span className="float-xs-right">
            <MoneyFormat sum={account.currentBalance} currencyId={account.currency} />
          </span>
        </li>
      ))}
    </ul>
    : <CardBlock>
      <p className="text-xs-center m-0"><FormattedMessage {...messages.noAccounts} /></p>
    </CardBlock>
  }
  </Card>
);

AccountList.propTypes = {
  accounts: React.PropTypes.array.isRequired,
};

const selector = createSelector(
  state => get(state, 'account.accounts', []),
  state => get(state, 'account.process', false),
  (accounts, process) => ({ accounts, process })
);

export default injectIntl(connect(selector)(AccountList));
