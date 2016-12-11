import React from 'react';
import { connect } from 'react-redux';
import { createSelector } from 'reselect';
import { Alert } from 'reactstrap';
import { defineMessages, injectIntl, FormattedMessage } from 'react-intl';
import { get } from 'lodash';
import classnames from 'classnames';

const messages = defineMessages({
  noAccounts: {
    id: 'component.linkedAccountList.noAccounts',
    description: 'Empty account list message',
    defaultMessage: 'You have no accounts',
  },
});

const LinkedAccountList = ({ accounts, selectedAccountId, onSelect }) => {
  if (accounts.length) {
    return (
      <div className="list-group">
        {accounts.map((account) => {
          const accountSelect = () => onSelect(account._id);
          const btnClassess = ['list-group-item', 'list-group-item-action'];

          if (account._id === selectedAccountId) {
            btnClassess.push('active');
          }

          return (
            <button
              key={account._id}
              type="button"
              className={classnames(...btnClassess)}
              onClick={accountSelect}
            >
              {account.name}
            </button>
          );
        })}
      </div>
    );
  }

  return <Alert color="info"><FormattedMessage {...messages.noAccounts} /></Alert>;
};

LinkedAccountList.propTypes = {
  accounts: React.PropTypes.array.isRequired,
  onSelect: React.PropTypes.func.isRequired,
  selectedAccountId: React.PropTypes.string,
};

const selector = createSelector(
  state => get(state, 'account.accounts', []),
  state => get(state, 'account.process', false),
  (accounts, process) => ({ accounts, process })
);

export default injectIntl(connect(selector)(LinkedAccountList));
