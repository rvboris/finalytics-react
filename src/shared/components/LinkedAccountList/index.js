import React from 'react';
import { connect } from 'react-redux';
import { createSelector } from 'reselect';
import { Alert } from 'reactstrap';
import { defineMessages, injectIntl, FormattedMessage } from 'react-intl';
import classnames from 'classnames';

const messages = defineMessages({
  noAccounts: {
    id: 'component.linkedAccountList.noAccounts',
    description: 'Empty account list message',
    defaultMessage: 'You have no accounts',
  },
});

const LinkedAccountList = (props) => {
  if (props.accounts.length) {
    return (
      <div className="list-group">
        {props.accounts.map((account) => {
          const onSelect = () => props.onSelect(account._id);
          const btnClassess = ['list-group-item', 'list-group-item-action'];

          if (account._id === props.selectedAccountId) {
            btnClassess.push('active');
          }

          return (
            <button
              key={account._id}
              type="button"
              className={classnames(...btnClassess)}
              onClick={onSelect}
            >
              {account.name}
            </button>
          );
        })}
      </div>
    );
  }

  return (<Alert color="info"><FormattedMessage {...messages.noAccounts} /></Alert>);
};

LinkedAccountList.propTypes = {
  accounts: React.PropTypes.array.isRequired,
  onSelect: React.PropTypes.func.isRequired,
  selectedAccountId: React.PropTypes.string,
};

const selector = createSelector(
  state => state.account.accounts,
  state => state.account.process,
  (accounts, process) => ({
    accounts: accounts || [],
    process,
  }),
);

export default injectIntl(connect(selector)(LinkedAccountList));
