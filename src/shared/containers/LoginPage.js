import React from 'react';
import { connect } from 'react-redux';
import { push } from 'react-router-redux';
import { bindActionCreators } from 'redux';
import { createSelector } from 'reselect';

import { authActions } from '../actions';
import LoginForm from '../components/LoginForm';

const onSuccess = (dispatch) => () => dispatch(push('/dashboard'));

const loginPage = (props) => {
  const action = bindActionCreators(authActions.login, props.dispatch);

  return (
    <LoginForm
      login = { action }
      onSuccess={ onSuccess(props.dispatch) }
    />
  );
};

loginPage.propTypes = {
  dispatch: React.PropTypes.func.isRequired,
};

const selector = createSelector(() => ({}), () => ({}));
export default connect(selector)(loginPage);
