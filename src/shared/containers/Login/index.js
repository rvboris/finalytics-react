import React from 'react';
import { push } from 'react-router-redux';
import { connect } from 'react-redux';

import { authActions } from '../../actions';
import LoginForm from '../../components/LoginForm';

const Login = (props) =>
  (<LoginForm login={props.login} go={props.go} onSuccess={props.onSuccess} />);

Login.propTypes = {
  login: React.PropTypes.func.isRequired,
  go: React.PropTypes.func.isRequired,
  onSuccess: React.PropTypes.any.isRequired,
};

const mapDispatchToProps = (dispatch) => ({
  login: (...args) => dispatch(authActions.login(...args)),
  go: (path) => dispatch(push(path)),
  onSuccess: () => dispatch(push('/dashboard/operations')),
});

export default connect(null, mapDispatchToProps)(Login);
