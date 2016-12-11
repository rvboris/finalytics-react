import React from 'react';
import moment from 'moment';
import classnames from 'classnames';
import { ButtonGroup, Button } from 'reactstrap';
import { defineMessages, injectIntl, FormattedMessage } from 'react-intl';

import style from './style.css';
import eventEmitter from '../../utils/event-emitter';
import MoneyFormat from '../MoneyFormat';

const messages = defineMessages({
  loading: {
    id: 'component.operationListItem.loading',
    description: 'Loading item status text',
    defaultMessage: 'Loading...',
  },
  remove: {
    id: 'component.operationListItem.remove',
    description: 'Remove item button text',
    defaultMessage: 'Remove',
  },
  edit: {
    id: 'component.operationListItem.edit',
    description: 'Edit item button text',
    defaultMessage: 'Edit',
  },
});

class OperationListItem extends React.Component {
  static propTypes = {
    operation: React.PropTypes.object,
    editOperation: React.PropTypes.func,
    editOperationItem: React.PropTypes.object,
    toggleOperationDeleteModal: React.PropTypes.func,
  };

  static getDate(date) {
    const now = moment().utc();
    const mDate = moment(date);
    let firstRow;
    let secondRow;

    if (now.diff(mDate, 'days') <= 7) {
      firstRow = mDate.format('dddd');
      secondRow = mDate.format('DD MMM');
    } else if (now.diff(mDate, 'years') >= 1) {
      firstRow = mDate.format('MMMM');
      secondRow = mDate.format('DD.MM.YY');
    } else {
      firstRow = mDate.format('MMMM');
      secondRow = mDate.format('DD ddd');
    }

    return (
      <div className={style.date}>
        <div>{firstRow}</div>
        <div>{secondRow}</div>
      </div>
    );
  }

  static getAmount(amount, currencyId) {
    if (amount < 0) {
      return <MoneyFormat sum={amount} currencyId={currencyId} />;
    }

    return (<span>+<MoneyFormat sum={amount} currencyId={currencyId} /></span>);
  }

  static getColorMark(operationType) {
    return <div className={classnames(style.mark, style[operationType])} />;
  }

  static getCategory({ name }) {
    return (
      <div className={style.category}>
        <div>{name}</div>
      </div>
    );
  }

  static getOperationDetails({ transfer, account, amount }) {
    if (transfer) {
      return (
        <div className={style.details}>
          <div className={style.transferAaccount}>
            <div>{account.name}</div>
            <div>{transfer.account.name}</div>
          </div>
          <div className={style.transferAmount}>
            <div>
              {OperationListItem.getAmount(amount, account.currency)}
            </div>
            <div>
              {OperationListItem.getAmount(transfer.amount, transfer.account.currency)}
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className={style.details}>
        <div className={style.account}>
          <div>{account.name}</div>
        </div>
        <div className={style.amount}>
          <div>
            {OperationListItem.getAmount(amount, account.currency)}
          </div>
        </div>
      </div>
    );
  }

  constructor(props, context) {
    super(props, context);

    this.state = {
      showControls: false,
      isEdit: this.isEditActive(props.editOperationItem),
    };

    eventEmitter.on('operation.editOperationItem', this.toggleEdit);
  }

  componentWillUnmount() {
    eventEmitter.off('operation.editOperationItem', this.toggleEdit);
  }

  getControls() {
    return (
      <div className={style.controls}>
        <ButtonGroup>
          <Button outline color="danger" size="sm" onClick={this.removeOperation}>
            <FormattedMessage {...messages.remove} />
          </Button>
          <Button outline color="primary" size="sm" onClick={this.editOperation}>
            <FormattedMessage {...messages.edit} />
          </Button>
        </ButtonGroup>
      </div>
    );
  }

  removeOperation = () => {
    const { toggleOperationDeleteModal, operation } = this.props;
    toggleOperationDeleteModal(operation);
  }

  editOperation = () => {
    const { editOperation, operation } = this.props;
    editOperation(operation);
  }

  showControls = () => {
    this.setState(Object.assign({}, this.state, { showControls: true }));
  }

  hideControls = () => {
    this.setState(Object.assign({}, this.state, { showControls: false }));
  }

  isEditActive(editOperationItem) {
    const { operation } = this.props;
    return editOperationItem && operation && editOperationItem._id === operation._id;
  }

  toggleEdit = (editOperationItem) => {
    this.setState(Object.assign({}, this.state, {
      isEdit: this.isEditActive(editOperationItem),
    }));
  }

  render() {
    const { operation } = this.props;
    const { showControls, isEdit } = this.state;

    if (!operation) {
      return (
        <div className={style.operation}>
          <span className={style.loading}>
            <FormattedMessage {...messages.loading} />
          </span>
        </div>
      );
    }

    const itemClassName = classnames(style.operation, isEdit && style.edit);

    return (
      <div
        className={itemClassName}
        onMouseOver={this.showControls}
        onMouseLeave={this.hideControls}
      >
        {OperationListItem.getColorMark(operation.type)}
        {OperationListItem.getDate(operation.created)}
        {showControls && this.getControls()}
        {!showControls && OperationListItem.getCategory(operation.category)}
        {OperationListItem.getOperationDetails(operation)}
      </div>
    );
  }
}

export default injectIntl(OperationListItem);
