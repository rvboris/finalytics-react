import React from 'react';
import { get } from 'lodash';
import { push } from 'react-router-redux';
import { connect } from 'react-redux';
import { Button } from 'react-bootstrap';

import style from './style.css';
import LinkedAccountList from '../../components/LinkedAccountList';
import AccountEditForm from '../../components/AccountEditForm';

const Accounts = (props) => {
  const selectedAccountId = get(props, 'params.accountId', null);

  return (
    <div>
      <h3>Управление счетами</h3>
      <hr />
      <div className={style.accounts}>
        <div className={style['account-list-container']}>
          <LinkedAccountList onSelect={props.selectAccount} selectedAccountId={selectedAccountId} />
          <Button block bsSize="large" bsStyle="primary" className={style['account-create']}>
            Создать новый
          </Button>
        </div>
        <div className={style['account-details-container']}>
          <AccountEditForm accountId={selectedAccountId} />
        </div>
      </div>
    </div>
  );
};

Accounts.propTypes = {
  selectAccount: React.PropTypes.func.isRequired,
};

const mapDispatchToProps = (dispatch) => ({
  selectAccount: (accountId) => dispatch(push(`/dashboard/accounts/${accountId}`)),
});

export default connect(null, mapDispatchToProps)(Accounts);
