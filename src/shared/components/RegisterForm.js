import React from 'react';
import { createSelector } from 'reselect';
import { reduxForm } from 'redux-form';
import { each, noop } from 'lodash';
import { defineMessages, FormattedMessage, injectIntl } from 'react-intl';

import FlatButton from 'material-ui/lib/flat-button';
import IconButton from 'material-ui/lib/icon-button';
import TextField from 'material-ui/lib/text-field';
import Paper from 'material-ui/lib/paper';

import validationHandler from '../utils/validation-handler';
import styles from './RegisterForm.css';
import fonts from '../fonts.css';

const fields = ['email', 'password', 'repeatPassword'];

const messages = defineMessages({
  title: {
    id: 'auth.register.title',
    description: 'Register dialog title',
    defaultMessage: 'Register',
  },
  email: {
    hint: {
      id: 'auth.register.email.hint',
      description: 'Register dialog email hint',
      defaultMessage: 'your@email.com',
    },
    floatHint: {
      id: 'auth.register.email.floatHint',
      description: 'Register dialog email float hint',
      defaultMessage: 'Enter your email',
    },
  },
  password: {
    hint: {
      id: 'auth.register.password.hint',
      description: 'Register dialog password hint',
      defaultMessage: 'strong password',
    },
    floatHint: {
      id: 'auth.register.password.floatHint',
      description: 'Register dialog password float hint',
      defaultMessage: 'Enter your password',
    },
  },
  repeatPassword: {
    hint: {
      id: 'auth.register.repeatPassword.hint',
      description: 'Register dialog password repeat hint',
      defaultMessage: 'repeat password',
    },
    floatHint: {
      id: 'auth.register.repeatPassword.floatHint',
      description: 'Register dialog repeat password float hint',
      defaultMessage: 'Enter your password again',
    },
  },
  button: {
    id: 'auth.register.button',
    description: 'Register dialog submit button label',
    defaultMessage: 'Register',
  },
  processButton: {
    id: 'auth.register.processButton',
    description: 'Register dialog submit button label in process state',
    defaultMessage: 'Please wait...',
  },
});

const onGoogle = () => {
  window.location.pathname = '/api/auth/google';
};

const onFacebook = () => {
  window.location.pathname = '/api/auth/facebook';
};

const onTwitter = () => {
  window.location.pathname = '/api/auth/twitter';
};

let RegisterForm = (props) => {
  const {
    form: { fields: { email, password, repeatPassword }, handleSubmit, fields },
    intl: { formatMessage },
    process,
    register,
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
        result = await register(values);
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
      <Paper className={ styles.register } zDepth={ 1 }>
        <h3><FormattedMessage { ...messages.title } /></h3>

        <form onSubmit={ onSubmit } noValidate>
          <div className={ styles.fields }>
            <div>
              <TextField id="register-email" type="email" { ...email } />
            </div>
            <div>
              <TextField id="register-password" type="password" { ...password } />
            </div>
            <div>
              <TextField id="register-repeat-password" type="password" { ...repeatPassword } />
            </div>
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

        <div className={ styles.social }>
          <IconButton
            onTouchTap={ onGoogle }
            iconClassName={ `social ${fonts['icon-google']}` }
            tooltip="Google"
          />
          <IconButton
            onTouchTap={ onFacebook }
            iconClassName={ `social ${fonts['icon-facebook']}` }
            tooltip="Facebook"
          />
          <IconButton
            onTouchTap={ onTwitter }
            iconClassName={ `social ${fonts['icon-twitter']}` }
            tooltip="Twitter"
          />
        </div>
      </Paper>
    </div>
  );
};

RegisterForm.propTypes = {
  form: React.PropTypes.object.isRequired,
  intl: React.PropTypes.object.isRequired,
  process: React.PropTypes.bool.isRequired,
  register: React.PropTypes.func.isRequired,
  onSuccess: React.PropTypes.func,
  onError: React.PropTypes.func,
};

const selector = createSelector(state => ({ process: state.auth.process }), state => state);

RegisterForm = reduxForm({
  form: 'register',
  propNamespace: 'form',
  returnRejectedSubmitPromise: true,
  fields,
}, selector)(RegisterForm);

export default RegisterForm = injectIntl(RegisterForm);
