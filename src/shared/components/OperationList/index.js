import React from 'react';
import { connect } from 'react-redux';
import { List, AutoSizer, WindowScroller } from 'react-virtualized';
import { createSelector } from 'reselect';
import { noop, memoize } from 'lodash';
import TreeModel from 'tree-model';
import moment from 'moment';

import style from './style.css';
import InfiniteLoader from '../InfiniteLoader';
import MoneyFormat from '../MoneyFormat';
import { operationActions } from '../../actions';
import { defaultQuery } from '../../reducers/operation';

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

    if (now.diff(mDate, 'days') <= 7) {
      return mDate.format('dddd DD');
    }

    if (now.diff(mDate, 'years') >= 1) {
      return mDate.format('DD.MM.YY');
    }

    return mDate.format('DD MMMM');
  }

  getOperationDetails(operation) {
    if (operation.transfer) {
      return (
        <div className={style['operation-details']}>
          <div className={style['operation-account']}>{operation.account.name}</div>
          <div className={style['operation-amount']}>
            <MoneyFormat num={operation.amount} currencyId={operation.account.currency} />
          </div>
        </div>
      );
    }

    return (
      <div className={style['operation-details']}>
        <div className={style['operation-account']}>{operation.account.name}</div>
        <div className={style['operation-amount']}>
          <MoneyFormat num={operation.amount} currencyId={operation.account.currency} />
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
      content = 'Loading...';
    } else {
      const operation = this.props.operationList[index];

      content = (
        <div key={key} className={style['operation-list-item']}>
          <div className={style['operation-date']}>{this.getDate(operation.created)}</div>
          <div className={style['operation-category']}>{operation.category.name}</div>
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

      newOperation.account = accountFindMemoize(operation.account);

      if (operation.transfer) {
        newOperation.transfer.account = accountFindMemoize(operation.transfer.account);
      }

      newOperation.category = categoryFindMemoize(operation.category);

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

export default connect(selector, mapDispatchToProps)(OperationList);
