import React from 'react';
import { push } from 'react-router-redux';
import { connect } from 'react-redux';

import { authActions } from '../../actions';
import LoginForm from '../../components/LoginForm';

const Login = ({ login, go, onSuccess }) =>
  <LoginForm login={login} go={go} onSuccess={onSuccess} />;

Login.propTypes = {
  login: React.PropTypes.func.isRequired,
  go: React.PropTypes.func.isRequired,
  onSuccess: React.PropTypes.func.isRequired,
};

const mapDispatchToProps = (dispatch) => ({
  login: (...args) => dispatch(authActions.login(...args)),
  go: (path) => dispatch(push(path)),
  onSuccess: () => dispatch(push('/dashboard/operations')),
});

export default connect(null, mapDispatchToProps)(Login);
