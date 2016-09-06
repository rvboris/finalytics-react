import React from 'react';
import { connect } from 'react-redux';
import { createSelector } from 'reselect';

import classnames from 'classnames';
import MoneyFormat from '../MoneyFormat';
import style from './style.css';

const AccountList = (props) => (
  <div>
    <div className="panel panel-default">
      <div className="panel-heading">
        <h3 className={classnames('panel-title', 'pull-left', style['account-list-title'])}>
          Счета
        </h3>
        <button className="btn btn-default pull-right">Управление</button>
        <div className="clearfix" />
      </div>
      <ul className="list-group">
        {props.accounts.map((account) => (
          <li className="list-group-item" key={account._id}>
            <span className="badge">
              <MoneyFormat sum={account.currentBalance} currencyId={account.currency} />
            </span>
            {account.name}
          </li>
        ))}
      </ul>
    </div>
  </div>
);

AccountList.propTypes = {
  accounts: React.PropTypes.array.isRequired,
};

const selector = createSelector(
  state => state.account.accounts,
  state => state.account.process,
  (accounts, process) => ({
    accounts: accounts || [],
    process,
  }),
);

export default connect(selector)(AccountList);
