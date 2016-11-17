import React from 'react';
import { connect } from 'react-redux';
import { List, InfiniteLoader } from 'react-virtualized';
import { createSelector } from 'reselect';

import { operationActions } from '../../actions';

const OperationList = ({ hasNextPage, process, list, loadNextPage }) => {
  const rowCount = hasNextPage ? list.size + 1 : list.size;
  const loadMoreRows = process ? () => {} : loadNextPage;
  const isRowLoaded = ({ index }) => !hasNextPage || index < list.size;

  const rowRenderer = ({ index, key, style }) => {
    let content;

    if (!isRowLoaded({ index })) {
      content = 'Loading...';
    } else {
      content = list.getIn([index, 'name']);
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
      rowCount={rowCount}
    >
      {({ onRowsRendered, registerChild }) => (
        <List
          ref={registerChild}
          onRowsRendered={onRowsRendered}
          rowRenderer={rowRenderer}
          height="500"
          width="400"
          rowHeight="30"
          rowCount={rowCount}
        />
      )}
    </InfiniteLoader>
  );
};

OperationList.propTypes = {
  hasNextPage: React.PropTypes.bool.isRequired,
  process: React.PropTypes.bool.isRequired,
  list: React.PropTypes.array.isRequired,
  loadNextPage: React.PropTypes.func.isRequired,
};

const processSelector = createSelector(
  state => state.operation.process,
  process => process,
);

const listSelector = createSelector(
  state => state.operation.list.asMutable(),
  (operations) => operations,
);

const hasNextPageSelector = createSelector(
  listSelector,
  state => state.operation.total,
  (list, total) => list.length < total,
);

const selector = createSelector(
  processSelector,
  hasNextPageSelector,
  listSelector,
  (process, hasNextPage, list) => ({
    process,
    hasNextPage,
    list,
  })
);

const mapDispatchToProps = dispatch => ({
  loadNextPage: (...args) => dispatch(operationActions.list(...args)),
});

export default connect(selector, mapDispatchToProps)(OperationList);
