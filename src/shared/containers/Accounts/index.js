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
        <div className={style.list}>
          <Button
            type="button"
            block
            color="primary"
            className="mb-3"
            onClick={props.onNewAccount}
          >
            <FormattedMessage {...messages.createAccount} />
          </Button>

          <LinkedAccountList
            onSelect={props.onSelectAccount}
            selectedAccountId={selectedAccountId}
          />
        </div>
        <div className={classnames(style.details, 'ml-3')}>
          <AccountEditForm accountId={selectedAccountId} />
        </div>
      </div>
    </div>
  );
};

Accounts.propTypes = {
  onSelectAccount: React.PropTypes.func.isRequired,
  onNewAccount: React.PropTypes.func.isRequired,
};

const mapDispatchToProps = (dispatch) => ({
  onSelectAccount: (accountId) => dispatch(push(`/dashboard/accounts/${accountId}`)),
  onNewAccount: () => dispatch(push('/dashboard/accounts/new')),
});

export default injectIntl(connect(null, mapDispatchToProps)(Accounts));
