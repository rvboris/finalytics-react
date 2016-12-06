import React from 'react';
import classnames from 'classnames';
import { connect } from 'react-redux';
import { createSelector } from 'reselect';
import { defineMessages, injectIntl, FormattedMessage } from 'react-intl';
import {
  Alert,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
} from 'reactstrap';

import { error } from '../../log';
import { operationActions } from '../../actions';
import { defaultQuery } from '../../reducers/operation';
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
  removeOperationModalTitle: {
    id: 'container.operations.removeOperationModalTitle',
    description: 'Remove operation modal title',
    defaultMessage: 'Remove operation',
  },
  removeOperationModalInfo: {
    id: 'container.operations.removeOperationModalInfo',
    description: 'Remove operation modal info',
    defaultMessage: 'Are you sure you want to delete this operation?',
  },
  removeOperationModalError: {
    id: 'container.operations.removeOperationModalError',
    description: 'Remove operation modal error',
    defaultMessage: 'When you delete an operation error occurred',
  },
  removeOperationModalCancelButton: {
    id: 'container.operations.removeOperationModalCancelButton',
    description: 'Label of remove operation modal cancel button',
    defaultMessage: 'Cancel',
  },
  removeOperationModalConfirmButton: {
    id: 'container.operations.removeOperationModalConfirmButton',
    description: 'Label of remove operation modal confirm button',
    defaultMessage: 'Remove',
  },
  removeOperationModalProcessButton: {
    id: 'container.operations.removeOperationModalProcessButton',
    description: 'Label of remove operation modal process button',
    defaultMessage: 'Removing...',
  },
});

class Operations extends React.Component {
  static propTypes = {
    accountsExist: React.PropTypes.bool.isRequired,
    listOperations: React.PropTypes.func.isRequired,
    operationProcess: React.PropTypes.bool.isRequired,
    removeOperation: React.PropTypes.func.isRequired,
  }

  constructor(...args) {
    super(...args);

    this.toggleOperationDeleteModal = this.toggleOperationDeleteModal.bind(this);
    this.removeOperation = this.removeOperation.bind(this);
    this.editOperation = this.editOperation.bind(this);

    this.state = { operationDeleteModal: false };
  }

  componentDidMount() {
    this.props.listOperations(defaultQuery);
  }

  toggleOperationDeleteModal(operation) {
    this.setState(Object.assign({}, this.state, {
      operationDeleteModal: !this.state.operationDeleteModal,
      operationToDelete: operation,
    }));
  }

  removeOperation() {
    const { removeOperation } = this.props;
    const { operationToDelete } = this.state;

    return removeOperation({ _id: operationToDelete._id })
      .then(() => {
        this.toggleOperationDeleteModal();
      }, (e) => {
        error(e);
        this.setState(Object.assign(this.state, { operationDeleteModal: true }));
      });
  }

  editOperation(operation) {
    this.setState(Object.assign({}, this.state, {
      operationToEdit: operation,
    }));
  }

  render() {
    const { accountsExist, operationProcess } = this.props;
    const { operationDeleteModal, operationDeleteError, operationToEdit } = this.state;

    return (
      <div className={style.operations}>
        <div className={style['operations-container']}>
          { accountsExist && <OperationEditForm operation={operationToEdit} /> }

          { accountsExist &&
            <OperationList
              toggleOperationDeleteModal={this.toggleOperationDeleteModal}
              editOperation={this.editOperation}
            />
          }

          { !accountsExist &&
            <Alert color="info"><FormattedMessage {...messages.noAccounts} /></Alert>
          }

          <Modal isOpen={operationDeleteModal} toggle={this.toggleOperationDeleteModal}>
            <ModalHeader toggle={this.toggleOperationDeleteModal}>
              <FormattedMessage {...messages.removeOperationModalTitle} />
            </ModalHeader>
            <ModalBody>
              <p><FormattedMessage {...messages.removeOperationModalInfo} /></p>
            </ModalBody>
            <ModalFooter>
              { operationDeleteError &&
                <p className="text-danger">
                  <FormattedMessage {...messages.removeOperationModalError} />
                </p>
              }

              <Button
                onClick={this.removeOperation}
                disabled={operationProcess}
                color="danger"
                className="mr-1"
              >
                {
                  operationProcess
                    ? <FormattedMessage {...messages.removeOperationModalProcessButton} />
                    : <FormattedMessage {...messages.removeOperationModalConfirmButton} />
                }
              </Button>

              <Button onClick={this.toggleOperationDeleteModal} disabled={operationProcess}>
                <FormattedMessage {...messages.removeOperationModalCancelButton} />
              </Button>
            </ModalFooter>
          </Modal>
        </div>
        <div className={classnames(style['balance-container'], 'ml-2')}>
          <AccountList />
        </div>
      </div>
    );
  }
}

const operationProcessSelector = createSelector(
  state => state.operation.process,
  process => process
);

const accountsExistSelector = createSelector(
  state => state.account.accounts || [],
  (accountList = []) => accountList.length > 0
);

const selector = createSelector(
  accountsExistSelector,
  operationProcessSelector,
  (accountsExist, operationProcess) => ({ accountsExist, operationProcess })
);

const mapDispatchToProps = dispatch => ({
  listOperations: (...args) => dispatch(operationActions.list(...args)),
  removeOperation: (...args) => dispatch(operationActions.remove(...args)),
});

export default injectIntl(connect(selector, mapDispatchToProps)(Operations));
