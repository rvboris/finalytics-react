import React from 'react';
import { connect } from 'react-redux';
import { createSelector } from 'reselect';
import { Alert, ListGroup, ListGroupItem } from 'react-bootstrap';
import { defineMessages, injectIntl, FormattedMessage } from 'react-intl';

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
      <ListGroup>
        {props.accounts.map((account) => {
          const onSelect = () => props.onSelect(account._id);

          return (
            <ListGroupItem
              onClick={onSelect}
              active={account._id === props.selectedAccountId}
              key={account._id}
            >
              {account.name}
            </ListGroupItem>
          );
        })}
      </ListGroup>
    );
  }

  return (<Alert><FormattedMessage {...messages.noAccounts} /></Alert>);
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
