import React from 'react';
import classnames from 'classnames';
import { connect } from 'react-redux';
import { createSelector } from 'reselect';
import { Alert } from 'reactstrap';
import { defineMessages, injectIntl, FormattedMessage } from 'react-intl';
import VisibilitySensor from 'react-visibility-sensor';

import { operationActions } from '../../actions';
import AccountList from '../../components/AccountList';
import OperationList from '../../components/OperationList';
import OperationEditForm from '../../components/OperationEditForm';
import style from './style.css';

const messages = defineMessages({
  noAccounts: {
    id: 'container.operations.noAccounts',
    description: 'Account not found alert',
    defaultMessage: 'Accounts not found',
  },
});

class Operations extends React.Component {
  static propTypes = {
    accountsExist: React.PropTypes.bool.isRequired,
    listOperations: React.PropTypes.func.isRequired,
  }

  constructor(props) {
    super(props);

    this.state = {
      accountListVisible: true,
    };

    this.onAccountVisibleChange = this.onAccountVisibleChange.bind(this);
  }

  componentDidMount() {
    this.props.listOperations();
  }

  onAccountVisibleChange(accountListVisible) {
    this.setState(Object.assign({}, this.state, { accountListVisible }));
  }

  render() {
    const { accountsExist } = this.props;
    const { accountListVisible } = this.state;

    return (
      <div className={style.operations}>
        <div className={style['operations-container']}>
          { accountsExist && <OperationEditForm /> }
          { accountsExist && <OperationList /> }
          { !accountsExist &&
            <Alert color="info"><FormattedMessage {...messages.noAccounts} /></Alert>
          }
        </div>
        <div className={accountListVisible && classnames(style['balance-container'], 'ml-2')}>
          {accountListVisible && <AccountList />}
          <VisibilitySensor onChange={this.onAccountVisibleChange} />
        </div>
      </div>
    );
  }
}

const accountsExistSelector = createSelector(
  state => state.account.accounts || [],
  (accountList = []) => accountList.length > 0
);

const selector = createSelector(
  accountsExistSelector,
  accountsExist => ({ accountsExist })
);

const mapDispatchToProps = dispatch => ({
  listOperations: (...args) => dispatch(operationActions.list(...args)),
});

export default injectIntl(connect(selector, mapDispatchToProps)(Operations));
