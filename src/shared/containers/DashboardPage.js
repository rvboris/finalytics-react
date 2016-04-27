import React from 'react';
import { connect } from 'react-redux';
import { push } from 'react-router-redux';
import { createSelector } from 'reselect';

import Toolbar from 'material-ui/Toolbar/Toolbar';
import ToolbarGroup from 'material-ui/Toolbar/ToolbarGroup';
import ToolbarTitle from 'material-ui/Toolbar/ToolbarTitle';
import FlatButton from 'material-ui/FlatButton';

const goToMain = (dispatch) => () => dispatch(push('/dashboard'));
const goToLogout = (dispatch) => () => dispatch(push('/logout'));

const dashboardPage = (props) => (
  <div>
    <Toolbar>
      <ToolbarGroup float="left">
        <ToolbarTitle text="Options" onTitleTouchTap={goToMain(props.dispatch)} />
        <FlatButton label="Обзор" primary />
        <FlatButton label="Операции" primary />
        <FlatButton label="Бюджет" primary />
        <FlatButton label="Отчеты" primary />
      </ToolbarGroup>

      <ToolbarGroup float="right" lastChild>
        <FlatButton label="Настройки" secondary />
        <FlatButton label="Выход" onClick={goToLogout(props.dispatch)} secondary />
      </ToolbarGroup>
    </Toolbar>
  </div>
);

dashboardPage.propTypes = {
  dispatch: React.PropTypes.func.isRequired,
  profile: React.PropTypes.object.isRequired,
};

const profileSelector = (state) => state.auth.profile;

const selector = createSelector(
  profileSelector,
  (profile) => ({ profile })
);

export default connect(selector)(dashboardPage);
