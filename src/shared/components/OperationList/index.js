import React from 'react';
import { connect } from 'react-redux';
import { List, AutoSizer, WindowScroller } from 'react-virtualized';
import { createSelector } from 'reselect';
import { noop, memoize } from 'lodash';
import { defineMessages, injectIntl, FormattedMessage } from 'react-intl';
import TreeModel from 'tree-model';
import moment from 'moment';
import classnames from 'classnames';
import { ButtonGroup, Button } from 'reactstrap';

import style from './style.css';
import InfiniteLoader from '../InfiniteLoader';
import MoneyFormat from '../MoneyFormat';
import { operationActions } from '../../actions';
import { defaultQuery } from '../../reducers/operation';

const messages = defineMessages({
  loading: {
    id: 'component.operationList.loading',
    description: 'Loading item status text',
    defaultMessage: 'Loading...',
  },
});

class OperationList extends React.Component {
  static propTypes = {
    process: React.PropTypes.bool.isRequired,
    operationList: React.PropTypes.array.isRequired,
    operationListQuery: React.PropTypes.object.isRequired,
    operationListTotal: React.PropTypes.number.isRequired,
    operationNeedUpdate: React.PropTypes.bool.isRequired,
    loadNextPage: React.PropTypes.func.isRequired,
  };

  constructor(...args) {
    super(...args);

    this.rowRenderer = this.rowRenderer.bind(this);
    this.loadQuery = this.loadQuery.bind(this);
    this.isRowLoaded = this.isRowLoaded.bind(this);
  }

  componentWillReceiveProps({ needUpdate }) {
    if (!needUpdate) {
      return;
    }

    const { skip, limit } = defaultQuery;
    this.loader.clearCache();
    this.loadQuery({ startIndex: skip, stopIndex: limit });
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
          <Button outline color="danger" size="sm">Удалить</Button>{' '}
          <Button outline color="primary" size="sm">Редактировать</Button>{' '}
        </ButtonGroup>
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

  loadQuery({ startIndex, stopIndex }) {
    const query = { limit: stopIndex, skip: startIndex };
    const fullQuery = this.props.operationListQuery.merge(query);

    return this.props.loadNextPage(fullQuery.asMutable());
  }

  rowRenderer({ index, key, style: positionStyle }) {
    let content;

    if (!this.isRowLoaded({ index })) {
      content = (
        <div key={key} className={style['operation-list-item']}>
          <span className={style['operation-loading']}>
            <FormattedMessage {...messages.loading} />
          </span>
        </div>
      );
    } else {
      const operation = this.props.operationList[index];

      content = (
        <div key={key} className={style['operation-list-item']}>
          {this.getControls()}
          {this.getColorMark(operation.type)}
          {this.getDate(operation.created)}
          <div className={style['operation-category']}>
            <div>{operation.category.name}</div>
          </div>
          {this.getOperationDetails(operation)}
        </div>
      );
    }

    return (<div key={key} style={positionStyle}>{content}</div>);
  }

  isRowLoaded({ index }) {
    return !!this.props.operationList[index];
  }

  render() {
    const { process, operationList, operationListTotal } = this.props;
    const loadMoreRows = process ? noop : this.loadQuery;

    return (
      <InfiniteLoader
        isRowLoaded={this.isRowLoaded}
        loadMoreRows={loadMoreRows}
        rowCount={operationListTotal}
        ref={this.loader}
      >
        {({ onRowsRendered, registerChild }) => (
          <WindowScroller>
            {({ height, scrollTop }) => (
              <AutoSizer disableHeight>
                {({ width }) => (
                  <List
                    ref={registerChild}
                    onRowsRendered={onRowsRendered}
                    rowRenderer={this.rowRenderer}
                    rowCount={operationList.length}
                    estimatedRowSize={operationListTotal}
                    scrollTop={scrollTop}
                    width={width}
                    height={height}
                    autoHeight
                    rowHeight={80}
                    style={{ overflow: 'visible' }}
                  />
                )}
              </AutoSizer>
            )}
          </WindowScroller>
        )}
      </InfiniteLoader>
    );
  }
}

const processSelector = createSelector(
  state => state.operation.process,
  process => process,
);

const operationListQuerySelector = createSelector(
  state => state.operation.query,
  (query) => query,
);

const categoryTreeSelector = createSelector(
  state => state.category.data,
  categoryData => {
    const tree = new TreeModel();
    const rootNode = tree.parse(categoryData);

    return rootNode;
  }
);

const categoryListSelector = createSelector(
  categoryTreeSelector,
  categoryTree => categoryTree.all()
);

const operationListSelector = createSelector(
  state => state.operation.list,
  state => state.account.accounts,
  categoryListSelector,
  (operations, accountList, categoryList) => {
    const accountFindMemoize = memoize(
      account => accountList.find(({ _id }) => _id === account),
      account => account
    );

    const categoryFindMemoize = memoize(
      category => categoryList.find(({ model }) => model._id === category).model,
      category => category
    );

    return operations.flatMap((operation) => {
      const newOperation = operation.asMutable({ deep: true });

      newOperation.category = categoryFindMemoize(operation.category);
      newOperation.account = accountFindMemoize(operation.account);

      if (operation.transfer) {
        newOperation.transfer.account = accountFindMemoize(operation.transfer.account);
      }

      return newOperation;
    });
  },
);

const operationListTotalSelector = createSelector(
  state => state.operation.total,
  (total) => total,
);

const operationNeedUpdateSelector = createSelector(
  state => state.operation.needUpdate,
  (needUpdate) => needUpdate,
);

const selector = createSelector(
  processSelector,
  operationListSelector,
  operationListQuerySelector,
  operationListTotalSelector,
  operationNeedUpdateSelector,
  (
    process,
    operationList,
    operationListQuery,
    operationListTotal,
    operationNeedUpdate
  ) => ({
    process,
    operationList,
    operationListQuery,
    operationListTotal,
    operationNeedUpdate,
  })
);

const mapDispatchToProps = dispatch => ({
  loadNextPage: (...args) => dispatch(operationActions.list(...args)),
});

export default injectIntl(connect(selector, mapDispatchToProps)(OperationList));
