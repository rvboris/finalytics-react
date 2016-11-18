import React from 'react';
import { connect } from 'react-redux';
import { List, InfiniteLoader, AutoSizer, WindowScroller } from 'react-virtualized';
import { createSelector } from 'reselect';
import { noop } from 'lodash';

import { operationActions } from '../../actions';

const OperationList = ({ process, list, listQuery, listTotal, loadNextPage }) => {
  const loadQuery = ({ startIndex, stopIndex }) =>
    loadNextPage(listQuery.merge({ limit: stopIndex, skip: startIndex }).asMutable());

  const loadMoreRows = process ? noop : loadQuery;
  const isRowLoaded = ({ index }) => !!list[index];

  const rowRenderer = ({ index, key, style }) => {
    let content;

    if (!isRowLoaded({ index })) {
      content = 'Loading...';
    } else {
      content = list[index].created;
    }

    return (<div key={key} style={style}>{content}</div>);
  };

  rowRenderer.propTypes = {
    index: React.PropTypes.any.isRequired,
    key: React.PropTypes.any.isRequired,
    style: React.PropTypes.any.isRequired,
  };

  return (
    <InfiniteLoader
      isRowLoaded={isRowLoaded}
      loadMoreRows={loadMoreRows}
      rowCount={listTotal}
    >
      {({ onRowsRendered, registerChild }) => (
        <WindowScroller>
          {({ height, scrollTop }) => (
            <AutoSizer disableHeight>
              {({ width }) => (
                <List
                  ref={registerChild}
                  onRowsRendered={onRowsRendered}
                  rowRenderer={rowRenderer}
                  rowCount={list.length}
                  estimatedRowSize={listTotal}
                  scrollTop={scrollTop}
                  width={width}
                  height={height}
                  autoHeight
                  rowHeight={30}
                />
              )}
            </AutoSizer>
          )}
        </WindowScroller>
      )}
    </InfiniteLoader>
  );
};

OperationList.propTypes = {
  process: React.PropTypes.bool.isRequired,
  list: React.PropTypes.array.isRequired,
  listQuery: React.PropTypes.object.isRequired,
  listTotal: React.PropTypes.number.isRequired,
  loadNextPage: React.PropTypes.func.isRequired,
};

const processSelector = createSelector(
  state => state.operation.process,
  process => process,
);

const listQuerySelector = createSelector(
  state => state.operation.query,
  (query) => query,
);

const listSelector = createSelector(
  state => state.operation.list,
  (operations) => operations,
);

const listTotalSelector = createSelector(
  state => state.operation.total,
  (total) => total,
);

const selector = createSelector(
  processSelector,
  listSelector,
  listQuerySelector,
  listTotalSelector,
  (process, list, listQuery, listTotal) => ({
    process,
    list,
    listQuery,
    listTotal,
  })
);

const mapDispatchToProps = dispatch => ({
  loadNextPage: (...args) => dispatch(operationActions.list(...args)),
});

export default connect(selector, mapDispatchToProps)(OperationList);
