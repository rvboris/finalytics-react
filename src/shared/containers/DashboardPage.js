import React from 'react';
import { connect } from 'react-redux';
import { push } from 'react-router-redux';
import { createSelector } from 'reselect';

import Toolbar from 'material-ui/lib/toolbar/toolbar';
import ToolbarGroup from 'material-ui/lib/toolbar/toolbar-group';
import ToolbarTitle from 'material-ui/lib/toolbar/toolbar-title';
import FlatButton from 'material-ui/lib/flat-button';

const goToMain = (dispatch) => () => dispatch(push('/dashboard'));
const goToLogout = (dispatch) => () => dispatch(push('/logout'));

const dashboardPage = (props) => {
  const { dispatch } = props;

  return (
    <div>
      <Toolbar>
        <ToolbarGroup float="left">
          <ToolbarTitle text="Options" onTitleTouchTap={ goToMain(dispatch) } />
          <FlatButton label="Обзор" primary />
          <FlatButton label="Операции" primary />
          <FlatButton label="Бюджет" primary />
          <FlatButton label="Отчеты" primary />
        </ToolbarGroup>

        <ToolbarGroup float="right" lastChild={ true }>
          <FlatButton label="Настройки" secondary />
          <FlatButton label="Выход" onTouchTap={ goToLogout(dispatch) } secondary />
        </ToolbarGroup>
      </Toolbar>
    </div>
  );
};

dashboardPage.propTypes = {
  dispatch: React.PropTypes.func.isRequired,
};

const selector = createSelector(state => state, state => state);
export default connect(selector)(dashboardPage);
