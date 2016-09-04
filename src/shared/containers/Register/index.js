import React from 'react';
import { connect } from 'react-redux';
import { push } from 'react-router-redux';

import { authActions } from '../../actions';
import RegisterForm from '../../components/RegisterForm';

const Register = (props) =>
  (<RegisterForm register={props.register} onSuccess={props.onSuccess} />);

Register.propTypes = {
  register: React.PropTypes.func.isRequired,
  onSuccess: React.PropTypes.func.isRequired,
};

const mapDispatchToProps = (dispatch) => ({
  register: (...args) => dispatch(authActions.register(...args)),
  onSuccess: () => dispatch(push('/dashboard/operations')),
});

export default connect(null, mapDispatchToProps)(Register);
