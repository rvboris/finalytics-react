import React from 'react';
import { connect } from 'react-redux';
import { createSelector } from 'reselect';
import { defineMessages, injectIntl, FormattedMessage } from 'react-intl';
import { Button, Card, CardHeader, CardBlock } from 'reactstrap';
import { push } from 'react-router-redux';

import MoneyFormat from '../MoneyFormat';

const messages = defineMessages({
  manage: {
    id: 'component.accountList.manage',
    description: 'AccountList manage button',
    defaultMessage: 'Manage',
  },
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
    <CardHeader>
      <FormattedMessage {...messages.accounts} />
      <Button onClick={props.manageAccounts} className="float-xs-right" size="sm">
        <FormattedMessage {...messages.manage} />
      </Button>
    </CardHeader>
    { props.accounts.length
    ? <ul className="list-group list-group-flush">
      {props.accounts.map((account) => (
        <li className="list-group-item" key={account._id}>
          <span className="float-xs-right">
            <MoneyFormat sum={account.currentBalance} currencyId={account.currency} />
          </span>
          {account.name}
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
  manageAccounts: React.PropTypes.func.isRequired,
};

const mapDispatchToProps = (dispatch) => ({
  manageAccounts: () => dispatch(push('/dashboard/accounts')),
});

const selector = createSelector(
  state => state.account.accounts,
  state => state.account.process,
  (accounts, process) => ({
    accounts: accounts || [],
    process,
  }),
);

export default injectIntl(connect(selector, mapDispatchToProps)(AccountList));
