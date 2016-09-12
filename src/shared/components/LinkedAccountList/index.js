import React from 'react';
import { connect } from 'react-redux';
import { createSelector } from 'reselect';
import { ListGroup, ListGroupItem } from 'react-bootstrap';

const LinkedAccountList = (props) => (
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

export default connect(selector)(LinkedAccountList);
