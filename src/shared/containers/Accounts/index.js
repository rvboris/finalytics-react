import React from 'react';
import { get } from 'lodash';
import { push } from 'react-router-redux';
import { connect } from 'react-redux';
import { Button } from 'react-bootstrap';
import { defineMessages, injectIntl, FormattedMessage } from 'react-intl';

import style from './style.css';
import LinkedAccountList from '../../components/LinkedAccountList';
import AccountEditForm from '../../components/AccountEditForm';

const messages = defineMessages({
  manageAccounts: {
    id: 'containers.accounts.manageAccounts',
    description: 'Page title',
    defaultMessage: 'Account management',
  },
  createAccount: {
    id: 'containers.accounts.createAccount',
    description: 'Create account button',
    defaultMessage: 'Create new account',
  },
});

const Accounts = (props) => {
  const selectedAccountId = get(props, 'params.accountId', null);

  return (
    <div>
      <h3><FormattedMessage {...messages.manageAccounts} /></h3>
      <hr />
      <div className={style.accounts}>
        <div className={style['account-list-container']}>
          <LinkedAccountList onSelect={props.selectAccount} selectedAccountId={selectedAccountId} />
          <Button
            block
            bsStyle="primary"
            className={style['account-create']}
            onClick={props.newAccount}
          >
            <FormattedMessage {...messages.createAccount} />
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
  newAccount: React.PropTypes.func.isRequired,
};

const mapDispatchToProps = (dispatch) => ({
  selectAccount: (accountId) => dispatch(push(`/dashboard/accounts/${accountId}`)),
  newAccount: () => dispatch(push('/dashboard/accounts/new')),
});

export default injectIntl(connect(null, mapDispatchToProps)(Accounts));
