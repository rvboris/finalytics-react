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

  render() {
    const { accountsExist, operationProcess } = this.props;
    const { operationDeleteModal, operationDeleteError } = this.state;

    return (
      <div className={style.operations}>
        <div className={style['operations-container']}>
          { accountsExist && <OperationEditForm /> }

          { accountsExist &&
            <OperationList toggleOperationDeleteModal={this.toggleOperationDeleteModal} />
          }

          { !accountsExist &&
            <Alert color="info"><FormattedMessage {...messages.noAccounts} /></Alert>
          }

          <Modal isOpen={operationDeleteModal} toggle={this.toggleOperationDeleteModal}>
            <ModalHeader toggle={this.toggleOperationDeleteModal}>
              Удаление операции
            </ModalHeader>
            <ModalBody>
              <p>Вы уверены что хотите удалить операцию?</p>
            </ModalBody>
            <ModalFooter>
              { operationDeleteError &&
                <p className="text-danger">
                  Ошибка удаления операции
                </p>
              }

              <Button
                onClick={this.removeOperation}
                disabled={operationProcess}
                color="danger"
                className="mr-1"
              >
                Удалить
              </Button>

              <Button onClick={this.toggleOperationDeleteModal} disabled={operationProcess}>
                Отмена
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
