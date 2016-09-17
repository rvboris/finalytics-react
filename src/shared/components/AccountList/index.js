import React from 'react';
import { connect } from 'react-redux';
import { createSelector } from 'reselect';
import { defineMessages, injectIntl, FormattedMessage } from 'react-intl';
import { Button } from 'react-bootstrap';
import { push } from 'react-router-redux';

import classnames from 'classnames';
import MoneyFormat from '../MoneyFormat';
import style from './style.css';

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
  <div className="panel panel-default">
    <div className="panel-heading">
      <h3 className={classnames('panel-title', 'pull-left', style['account-list-title'])}>
        <FormattedMessage {...messages.accounts} />
      </h3>
      <Button className="pull-right" onClick={props.manageAccounts}>
        <FormattedMessage {...messages.manage} />
      </Button>
      <div className="clearfix" />
    </div>
    { props.accounts.length
      ? <ul className="list-group">
        {props.accounts.map((account) => (
          <li className="list-group-item" key={account._id}>
            <span className="badge">
              <MoneyFormat sum={account.currentBalance} currencyId={account.currency} />
            </span>
            {account.name}
          </li>
        ))}
      </ul>
      : <p className={classnames('text-center', style['account-list-empty-txt'])}>
        <FormattedMessage {...messages.noAccounts} />
      </p>
    }
  </div>
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