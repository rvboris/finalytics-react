import React from 'react';
import moment from 'moment';
import classnames from 'classnames';
import { ButtonGroup, Button } from 'reactstrap';
import { defineMessages, injectIntl, FormattedMessage } from 'react-intl';

import style from './style.css';
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
    toggleOperationDeleteModal: React.PropTypes.func,
  };

  constructor(...args) {
    super(...args);

    this.showControls = this.showControls.bind(this);
    this.hideControls = this.hideControls.bind(this);
    this.removeOperation = this.removeOperation.bind(this);

    this.state = {
      showControls: false,
    };
  }

  getDate(date) {
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
      <div className={style['operation-date']}>
        <div>{firstRow}</div>
        <div>{secondRow}</div>
      </div>
    );
  }

  getAmount(amount, currencyId) {
    if (amount < 0) {
      return <MoneyFormat sum={amount} currencyId={currencyId} />;
    }

    return (<span>+<MoneyFormat sum={amount} currencyId={currencyId} /></span>);
  }

  getColorMark(operationType) {
    const className = classnames(
      style['operation-color-mark'],
      style[`operation-color-mark-${operationType}`]
    );

    return <div className={className} />;
  }

  getControls() {
    return (
      <div className={style['operation-controls']}>
        <ButtonGroup>
          <Button outline color="danger" size="sm" onClick={this.removeOperation}>
            <FormattedMessage {...messages.remove} />
          </Button>
          <Button outline color="primary" size="sm">
            <FormattedMessage {...messages.edit} />
          </Button>
        </ButtonGroup>
      </div>
    );
  }

  getCategory({ name }) {
    return (
      <div className={style['operation-category']}>
        <div>{name}</div>
      </div>
    );
  }

  getOperationDetails(operation) {
    if (operation.transfer) {
      return (
        <div className={style['operation-details']}>
          <div className={style['operation-transfer-account']}>
            <div>{operation.account.name}</div>
            <div>{operation.transfer.account.name}</div>
          </div>
          <div className={style['operation-transfer-amount']}>
            <div>
              {this.getAmount(operation.amount, operation.account.currency)}
            </div>
            <div>
              {this.getAmount(operation.transfer.amount, operation.transfer.account.currency)}
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className={style['operation-details']}>
        <div className={style['operation-account']}>
          <div>{operation.account.name}</div>
        </div>
        <div className={style['operation-amount']}>
          <div>
            {this.getAmount(operation.amount, operation.account.currency)}
          </div>
        </div>
      </div>
    );
  }

  removeOperation() {
    const { toggleOperationDeleteModal, operation } = this.props;
    toggleOperationDeleteModal(operation);
  }

  showControls() {
    this.setState(Object.assign({}, this.state, { showControls: true }));
  }

  hideControls() {
    this.setState(Object.assign({}, this.state, { showControls: false }));
  }

  render() {
    const { operation } = this.props;
    const { showControls } = this.state;

    if (!operation) {
      return (
        <div className={style['operation-item']}>
          <span className={style['operation-loading']}>
            <FormattedMessage {...messages.loading} />
          </span>
        </div>
      );
    }

    return (
      <div
        className={style['operation-item']}
        onMouseOver={this.showControls}
        onMouseLeave={this.hideControls}
      >
        {this.getColorMark(operation.type)}
        {this.getDate(operation.created)}
        {showControls && this.getControls()}
        {!showControls && this.getCategory(operation.category)}
        {this.getOperationDetails(operation)}
      </div>
    );
  }
}

export default injectIntl(OperationListItem);
