import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';
import { push } from 'react-router-redux';

import { authActions } from '../../actions';
import RegisterForm from '../../components/RegisterForm';

const Register = ({ register, onSuccess }) =>
  <RegisterForm register={register} onSuccess={onSuccess} />;

Register.propTypes = {
  register: PropTypes.func.isRequired,
  onSuccess: PropTypes.func.isRequired,
};

const mapDispatchToProps = (dispatch) => ({
  register: (...args) => dispatch(authActions.register(...args)),
  onSuccess: () => dispatch(push('/dashboard/operations')),
});

export default connect(null, mapDispatchToProps)(Register);
