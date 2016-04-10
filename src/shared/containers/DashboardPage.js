import React from 'react';
import { connect } from 'react-redux';
import { push } from 'react-router-redux';
import { createSelector } from 'reselect';

import Toolbar from 'material-ui/lib/toolbar/toolbar';
import ToolbarGroup from 'material-ui/lib/toolbar/toolbar-group';
import ToolbarTitle from 'material-ui/lib/toolbar/toolbar-title';
import FlatButton from 'material-ui/lib/flat-button';

import { categoryActions } from '../actions';

const goToMain = (dispatch) => () => dispatch(push('/dashboard'));
const goToLogout = (dispatch) => () => dispatch(push('/logout'));

const dashboardPage = (props) => (
  <div>
    <Toolbar>
      <ToolbarGroup float="left">
        <ToolbarTitle text="Options" onTitleTouchTap={ goToMain(props.dispatch) } />
        <FlatButton label="Обзор" primary />
        <FlatButton label="Операции" primary />
        <FlatButton label="Бюджет" primary />
        <FlatButton label="Отчеты" primary />
      </ToolbarGroup>

      <ToolbarGroup float="right" lastChild>
        <FlatButton label="Настройки" secondary />
        <FlatButton label="Выход" onClick={ goToLogout(props.dispatch) } secondary />
      </ToolbarGroup>
    </Toolbar>
  </div>
);

dashboardPage.propTypes = {
  dispatch: React.PropTypes.func.isRequired,
  profile: React.PropTypes.object.isRequired,
};

dashboardPage.needs = [
  categoryActions.load,
];

const profileSelector = (state) => state.auth.profile;

const selector = createSelector(
  profileSelector,
  (profile) => ({ profile })
);

export default connect(selector)(dashboardPage);
