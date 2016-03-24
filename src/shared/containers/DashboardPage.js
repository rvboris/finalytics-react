import React from 'react';
import { connect } from 'react-redux';
import { push } from 'react-router-redux';
import { createSelector } from 'reselect';
import moment from 'moment-timezone';

import Toolbar from 'material-ui/lib/toolbar/toolbar';
import ToolbarGroup from 'material-ui/lib/toolbar/toolbar-group';
import ToolbarTitle from 'material-ui/lib/toolbar/toolbar-title';
import FlatButton from 'material-ui/lib/flat-button';

import { authActions } from '../actions';

const goToMain = (dispatch) => () => dispatch(push('/dashboard'));
const goToLogout = (dispatch) => () => dispatch(push('/logout'));

class DashboardPage extends React.Component {
  static propTypes = {
    dispatch: React.PropTypes.func.isRequired,
    profile: React.PropTypes.object.isRequired,
  }

  componentDidMount() {
    this.initProfileSettings();
  }

  initProfileSettings() {
    if (!this.props.profile.settings.timezone && __CLIENT__) {
      this.props.dispatch(authActions.setSettings({
        timezone: moment.tz.guess(),
        locale: 'auto',
      }));
    }
  }

  render() {
    const { dispatch } = this.props;

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

          <ToolbarGroup float="right" lastChild>
            <FlatButton label="Настройки" secondary />
            <FlatButton label="Выход" onTouchTap={ goToLogout(dispatch) } secondary />
          </ToolbarGroup>
        </Toolbar>
      </div>
    );
  }
}

const selector = createSelector(state => ({ profile: state.auth.profile }), state => state);
export default connect(selector)(DashboardPage);
