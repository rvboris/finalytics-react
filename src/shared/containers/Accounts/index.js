import React from 'react';
import { get } from 'lodash';
import { push } from 'react-router-redux';
import { connect } from 'react-redux';
import { Button } from 'reactstrap';
import { defineMessages, injectIntl, FormattedMessage } from 'react-intl';
import classnames from 'classnames';

import style from './style.css';
import LinkedAccountList from '../../components/LinkedAccountList';
import AccountEditForm from '../../components/AccountEditForm';

const messages = defineMessages({
  manageAccounts: {
    id: 'container.accounts.manageAccounts',
    description: 'Page title',
    defaultMessage: 'Account management',
  },
  createAccount: {
    id: 'container.accounts.createAccount',
    description: 'Create account button',
    defaultMessage: 'Create new account',
  },
});

const Accounts = (props) => {
  const selectedAccountId = get(props, 'params.accountId', null);

  return (
    <div>
      <h4><FormattedMessage {...messages.manageAccounts} /></h4>
      <hr />
      <div className={style.accounts}>
        <div className={style['account-list-container']}>
          <Button
            block
            color="primary"
            className="mb-1"
            onClick={props.newAccount}
          >
            <FormattedMessage {...messages.createAccount} />
          </Button>
          <LinkedAccountList onSelect={props.selectAccount} selectedAccountId={selectedAccountId} />
        </div>
        <div className={classnames(style['account-details-container'], 'ml-2')}>
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
