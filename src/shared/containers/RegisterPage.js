import React from 'react';
import { connect } from 'react-redux';
import { push } from 'react-router-redux';
import { bindActionCreators } from 'redux';
import { createSelector } from 'reselect';

import { authActions } from '../actions';
import RegisterForm from '../components/RegisterForm';

const onSuccess = (dispatch) => () => dispatch(push('/dashboard'));

const registerPage = (props) => {
  const action = bindActionCreators(authActions.register, props.dispatch);

  return (
    <RegisterForm
      register = { action }
      onSuccess={ onSuccess(props.dispatch) }
    />
  );
};

registerPage.propTypes = {
  dispatch: React.PropTypes.func.isRequired,
};

const selector = createSelector(() => ({}), () => ({}));
export default connect(selector)(registerPage);
