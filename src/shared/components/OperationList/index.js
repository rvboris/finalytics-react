import React from 'react';
import { connect } from 'react-redux';
import { List, AutoSizer, WindowScroller } from 'react-virtualized';
import { createSelector } from 'reselect';
import { noop, memoize, get } from 'lodash';
import TreeModel from 'tree-model';
import { Alert } from 'reactstrap';
import { defineMessages, injectIntl, FormattedMessage } from 'react-intl';

import './style.css';
import InfiniteLoader from '../InfiniteLoader';
import OperationListItem from '../OperationListItem';
import { operationActions } from '../../actions';
import { defaultQuery } from '../../reducers/operation';

const messages = defineMessages({
  noOperations: {
    id: 'components.operationList.noOperations',
    description: 'No operations info message',
    defaultMessage: 'You have not added any operation',
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
    toggleOperationDeleteModal: React.PropTypes.func.isRequired,
    editOperation: React.PropTypes.func.isRequired,
    editOperationItem: React.PropTypes.object,
  };

  static defaultProps = {
    editOperationItem: null,
  };

  componentWillReceiveProps({ needUpdate }) {
    if (!needUpdate) {
      return;
    }

    const { skip, limit } = defaultQuery;

    this.loader.clearCache();
    this.loadQuery({ startIndex: skip, stopIndex: limit });
  }

  loadQuery = ({ startIndex, stopIndex }) => {
    const query = { limit: stopIndex, skip: startIndex };
    const fullQuery = this.props.operationListQuery.merge(query);

    return this.props.loadNextPage(fullQuery.asMutable());
  }

  rowRenderer = ({ index, key, style: positionStyle }) => {
    const {
      toggleOperationDeleteModal,
      operationList,
      editOperation,
      editOperationItem,
    } = this.props;

    let operationListItem;

    if (!this.isRowLoaded({ index })) {
      operationListItem = <OperationListItem />;
    } else {
      const operation = operationList[index];
      operationListItem = (
        <OperationListItem
          operation={operation}
          toggleOperationDeleteModal={toggleOperationDeleteModal}
          editOperation={editOperation}
          editOperationItem={editOperationItem}
        />
      );
    }

    return (
      <div key={key} style={positionStyle}>
        {operationListItem}
      </div>
    );
  }

  isRowLoaded = ({ index }) => !!this.props.operationList[index];

  render() {
    const { process, operationList, operationListTotal } = this.props;
    const loadMoreRows = process ? noop : this.loadQuery;

    if (!operationListTotal) {
      return (
        <Alert color="info">
          <FormattedMessage {...messages.noOperations} />
        </Alert>
      );
    }

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
  state => get(state, 'operation.process', false),
  process => process,
);

const operationListQuerySelector = createSelector(
  state => get(state, 'operation.query'),
  (query) => query,
);

const categoryTreeSelector = createSelector(
  state => get(state, 'category.data'),
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
  state => get(state, 'operation.list', []),
  state => get(state, 'account.accounts', []),
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
  state => get(state, 'operation.total', 0),
  total => total,
);

const operationNeedUpdateSelector = createSelector(
  state => get(state, 'operation.needUpdate', false),
  needUpdate => needUpdate,
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
