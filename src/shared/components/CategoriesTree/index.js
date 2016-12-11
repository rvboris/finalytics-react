import React from 'react';
import { connect } from 'react-redux';
import { createSelector } from 'reselect';
import classnames from 'classnames';
import { get } from 'lodash';
import { defineMessages, injectIntl, FormattedMessage } from 'react-intl';

import TreeView from '../TreeView';
import style from './style.css';

const messages = defineMessages({
  expense: {
    id: 'component.categoriesTree.expense',
    description: 'Expense type label',
    defaultMessage: 'expense',
  },
  income: {
    id: 'component.categoriesTree.income',
    description: 'Income type label',
    defaultMessage: 'income',
  },
  any: {
    id: 'component.categoriesTree.any',
    description: 'Any type label',
    defaultMessage: 'any',
  },
});

const CategoriesTree = ({ categories, onSelect, selectedCategoryId }) => {
  const loopNodes = data => data.map((item) => {
    if (item.transfer) {
      return null;
    }

    const label = (
      <span>
        <span className={style.textLabel}>{item.name}</span>
        <span className={classnames('float-xs-right', style[item.type])}>
          <FormattedMessage {...messages[item.type]} />
        </span>
      </span>
    );

    return (
      <TreeView
        onSelect={onSelect}
        itemId={item._id}
        key={item._id}
        label={label}
        selected={item._id === selectedCategoryId}
        itemClassName={style.item}
        itemNoChildrenClassName={style.noChildren}
        chidlrenContainerClassName={style.children}
        labelClassName={style.label}
        labelSelectedClassName={style.selected}
        arrowClassName={style.arrow}
      >
        {item.children && item.children.length ? loopNodes(item.children) : null}
      </TreeView>
    );
  });

  return <div>{loopNodes(categories.children)}</div>;
};

CategoriesTree.propTypes = {
  categories: React.PropTypes.object.isRequired,
  onSelect: React.PropTypes.func.isRequired,
  selectedCategoryId: React.PropTypes.string,
};

const selector = createSelector(
  state => get(state, 'category.data'),
  state => get(state, 'category.process', false),
  (categories, process) => ({ categories, process })
);

export default injectIntl(connect(selector)(CategoriesTree));
