import React from 'react';
import classnames from 'classnames';
import { connect } from 'react-redux';
import { createSelector } from 'reselect';
import { Alert } from 'reactstrap';

import AccountList from '../../components/AccountList';
import OperationEditForm from '../../components/OperationEditForm';
import style from './style.css';

const Operations = (props) => (
  <div className={style.operations}>
    <div className={classnames(style['operations-container'], 'mr-2')}>
      { props.accountsExist && <OperationEditForm /> }
      { !props.accountsExist && <Alert color="info">Счета не найдены</Alert> }
    </div>
    <div className={style['balance-container']}>
      <AccountList />
    </div>
  </div>
);

Operations.propTypes = {
  accountsExist: React.PropTypes.bool.isRequired,
};

const accountsExistSelector = createSelector(
  state => state.account.accounts,
  accountList => accountList.length > 0
);

const selector = createSelector(
  accountsExistSelector,
  accountsExist => ({ accountsExist })
);

export default connect(selector)(Operations);
