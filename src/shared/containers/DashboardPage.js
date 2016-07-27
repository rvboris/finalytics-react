import React from 'react';
import { connect } from 'react-redux';
import { push } from 'react-router-redux';
import { createSelector } from 'reselect';

import AppBar from '../components/AppBar';

import {
  Button,
} from 'react-bootstrap';

const goToMain = (dispatch) => () => dispatch(push('/dashboard'));
const goToLogout = (dispatch) => () => dispatch(push('/logout'));

const DashboardPage = (props) => (
  <div>
    <AppBar />
    <Button onClick={goToMain(props.dispatch)}>Main</Button>
    <Button onClick={goToLogout(props.dispatch)}>Logout</Button>
  </div>
);

DashboardPage.propTypes = {
  dispatch: React.PropTypes.func.isRequired,
  profile: React.PropTypes.object.isRequired,
};

const selector = createSelector(
  state => state,
  (state) => ({ profile: state.auth.profile })
);

export default connect(selector)(DashboardPage);
