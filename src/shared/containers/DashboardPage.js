import React from 'react';
import { connect } from 'react-redux';
import { push } from 'react-router-redux';
import { createSelector } from 'reselect';
import moment from 'moment-timezone';

import Toolbar from 'material-ui/lib/toolbar/toolbar';
import ToolbarGroup from 'material-ui/lib/toolbar/toolbar-group';
import ToolbarTitle from 'material-ui/lib/toolbar/toolbar-title';
import FlatButton from 'material-ui/lib/flat-button';

import { authActions, categoryActions } from '../actions';

const goToMain = (dispatch) => () => dispatch(push('/dashboard'));
const goToLogout = (dispatch) => () => dispatch(push('/logout'));

class DashboardPage extends React.Component {
  static propTypes = {
    dispatch: React.PropTypes.func.isRequired,
    profile: React.PropTypes.object.isRequired,
    category: React.PropTypes.object.isRequired,
  }

  static needs = [
    categoryActions.load,
  ];

  componentDidMount() {
    this.initProfile();
  }

  async initProfile() {
    console.log(this.props);

    if (this.props.profile.status === 'init' && __CLIENT__) {
      await this.props.dispatch(authActions.setSettings({
        timezone: moment.tz.guess(),
        locale: 'auto',
      }));

      if (!this.props.category.data) {
        await this.props.dispatch(categoryActions.load());
      }

      this.props.dispatch(authActions.setStatus('ready'));
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

const selector = createSelector(state => ({
  profile: state.auth.profile,
  category: state.category,
}), state => state);

export default connect(selector)(DashboardPage);
