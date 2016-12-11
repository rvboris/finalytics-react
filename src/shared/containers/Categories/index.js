import React from 'react';
import { push } from 'react-router-redux';
import { get } from 'lodash';
import { connect } from 'react-redux';
import { Button } from 'reactstrap';
import { defineMessages, injectIntl, FormattedMessage } from 'react-intl';
import classnames from 'classnames';

import CategoriesTree from '../../components/CategoriesTree';
import CategoryEditForm from '../../components/CategoryEditForm';
import style from './style.css';

const messages = defineMessages({
  manageCategories: {
    id: 'container.categories.manageCategories',
    description: 'Page title',
    defaultMessage: 'Categories management',
  },
  createCategory: {
    id: 'container.categories.createCategory',
    description: 'Create category button',
    defaultMessage: 'Create new category',
  },
});

const Categories = (props) => {
  const selectedCategoryId = get(props, 'params.categoryId', null);

  return (
    <div>
      <h4><FormattedMessage {...messages.manageCategories} /></h4>
      <hr />
      <div className={style.categories}>
        <div className={style.tree}>
          <Button
            type="button"
            block
            color="primary"
            className="mb-1"
            onClick={props.onNewCategory}
          >
            <FormattedMessage {...messages.createCategory} />
          </Button>

          <CategoriesTree
            onSelect={props.onSelectCategory}
            selectedCategoryId={selectedCategoryId}
          />
        </div>
        <div className={classnames(style.details, 'ml-2')}>
          <CategoryEditForm categoryId={selectedCategoryId} />
        </div>
      </div>
    </div>
  );
};

Categories.propTypes = {
  onSelectCategory: React.PropTypes.func.isRequired,
  onNewCategory: React.PropTypes.func.isRequired,
};

const mapDispatchToProps = (dispatch) => ({
  onSelectCategory: (categoryId) => dispatch(push(`/dashboard/categories/${categoryId}`)),
  onNewCategory: () => dispatch(push('/dashboard/categories/new')),
});

export default injectIntl(connect(null, mapDispatchToProps)(Categories));
