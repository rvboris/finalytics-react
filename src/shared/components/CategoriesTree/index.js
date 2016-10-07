import React from 'react';
import { connect } from 'react-redux';
import { createSelector } from 'reselect';
import classnames from 'classnames';

import TreeView from '../TreeView';
import style from './style.css';

const categoryTypeMap = {
  expense: 'Расход',
  income: 'Доход',
  any: 'Любые',
};

const CategoriesTree = (props) => {
  const { categories, onSelect, selectedCategoryId } = props;

  const loopNodes = data => data.map((item) => {
    const label = (
      <span>
        <span className={style['tree-text-label']}>{item.name}</span>
        <span className={classnames('pull-right', style[`tree-type-label-${item.type}`])}>{categoryTypeMap[item.type]}</span>
      </span>
    );

    return (
      <TreeView
        onSelect={onSelect}
        itemId={item._id}
        key={item._id}
        label={label}
        selected={item._id === selectedCategoryId}
        itemClassName={style['tree-item']}
        itemNoChildrenClassName={style['tree-item-no-children']}
        chidlrenContainerClassName={style['tree-children-container']}
        labelClassName={style['tree-item-label']}
        labelSelectedClassName={style['tree-item-label-selected']}
        arrowClassName={style['tree-arrow']}
      >
        {item.children && item.children.length ? loopNodes(item.children) : null}
      </TreeView>
    );
  });

  return (
    <div>{loopNodes(categories.children)}</div>
  );
};

CategoriesTree.propTypes = {
  categories: React.PropTypes.object.isRequired,
  onSelect: React.PropTypes.func.isRequired,
  selectedCategoryId: React.PropTypes.string,
};

const selector = createSelector(
  state => state.category.data,
  state => state.category.process,
  (categories, process) => ({
    categories,
    process,
  }),
);

export default connect(selector)(CategoriesTree);