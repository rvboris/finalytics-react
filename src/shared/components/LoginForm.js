import React from 'react';
import { createSelector } from 'reselect';
import { reduxForm } from 'redux-form';
import { each, noop } from 'lodash';
import { defineMessages, FormattedMessage, injectIntl } from 'react-intl';

import FlatButton from 'material-ui/lib/flat-button';
import TextField from 'material-ui/lib/text-field';
import Paper from 'material-ui/lib/paper';

import validationHandler from '../utils/validation-handler';
import styles from './LoginForm.css';

const fields = ['email', 'password'];

const messages = defineMessages({
  title: {
    id: 'auth.login.title',
    description: 'Login dialog title',
    defaultMessage: 'Login',
  },
  email: {
    hint: {
      id: 'auth.login.email.hint',
      description: 'Login dialog email hint',
      defaultMessage: 'example@domain.com',
    },
    floatHint: {
      id: 'auth.login.email.floatHint',
      description: 'Login dialog email float hint',
      defaultMessage: 'Enter your email',
    },
  },
  password: {
    hint: {
      id: 'auth.login.password.hint',
      description: 'Login dialog password hint',
      defaultMessage: 'strong password',
    },
    floatHint: {
      id: 'auth.login.password.floatHint',
      description: 'Login dialog password float hint',
      defaultMessage: 'Enter your password',
    },
  },
  button: {
    id: 'auth.login.button',
    description: 'Login dialog submit button label',
    defaultMessage: 'Login',
  },
  processButton: {
    id: 'auth.login.processButton',
    description: 'Login dialog submit button label in process state',
    defaultMessage: 'Please wait...',
  },
});

let LoginForm = (props) => {
  const {
    form: { fields: { email, password }, handleSubmit, fields },
    intl: { formatMessage },
    process,
    login,
    onSuccess,
    onError,
  } = props;

  each(fields, (field, fieldName) => {
    field.hintText = formatMessage(messages[fieldName].hint);
    field.floatingLabelText = formatMessage(messages[fieldName].floatHint);

    if (field.touched && field.error) {
      field.errorText = formatMessage({ id: field.error });
    }
  });

  const submitHandler = (values) =>
    new Promise(async (resolve, reject) => {
      let result;

      try {
        result = await login(values);
      } catch (err) {
        reject(validationHandler(values, err));
        return;
      }

      resolve(result.data.token);
    });

  const onSubmit = e => {
    each(fields, (field) => {
      delete field.errorText;
    });

    handleSubmit(submitHandler)(e).then(onSuccess || noop, onError || noop);
  };

  return (
    <div className={ styles.container }>
      <Paper className={ styles.login } zDepth={ 1 }>
        <h3><FormattedMessage { ...messages.title } /></h3>

        <form onSubmit={ onSubmit } noValidate>
          <div>
            <TextField type="email" { ...email } />
          </div>
          <div>
            <TextField type="password" { ...password } />
          </div>
          <FlatButton
            type="submit"
            disabled={ process }
            label={ process
              ? formatMessage(messages.processButton)
              : formatMessage(messages.button)
            }
            primary
          />
        </form>
      </Paper>
    </div>
  );
};

LoginForm.propTypes = {
  form: React.PropTypes.object.isRequired,
  intl: React.PropTypes.object.isRequired,
  process: React.PropTypes.bool.isRequired,
  login: React.PropTypes.func.isRequired,
  onSuccess: React.PropTypes.func,
  onError: React.PropTypes.func,
};

const selector = createSelector(state => ({ process: state.auth.process }), state => state);

LoginForm = reduxForm({
  form: 'login',
  propNamespace: 'form',
  returnRejectedSubmitPromise: true,
  fields,
}, selector)(LoginForm);

export default LoginForm = injectIntl(LoginForm);
