import React from 'react';
import { createSelector } from 'reselect';
import { reduxForm } from 'redux-form';
import { each, noop } from 'lodash';
import { defineMessages, FormattedMessage, injectIntl } from 'react-intl';
import { Button, FormControl } from 'react-bootstrap';
import validationHandler from '../utils/validation-handler';
import styles from './LoginForm.css';
import fonts from '../fonts.css';

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
  registerButton: {
    id: 'auth.login.registerButton',
    description: 'Login dialog register button label',
    defaultMessage: 'Registration',
  },
});

let LoginForm = (props) => {
  const {
    form: { fields: { email, password }, handleSubmit, fields },
    intl: { formatMessage },
    process,
    login,
    go,
    onSuccess,
    onError,
  } = props;

  each(fields, (field, fieldName) => {
    field.hintText = formatMessage(messages[fieldName].hint);
    field.floatingLabelText = formatMessage(messages[fieldName].floatHint);
    field.fullWidth = true;

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

  const onRegister = () => go('/register');

  const onGoogle = () => {
    window.location.pathname = '/api/auth/google';
  };

  const onFacebook = () => {
    window.location.pathname = '/api/auth/facebook';
  };

  const onTwitter = () => {
    window.location.pathname = '/api/auth/twitter';
  };

  return (
    <div className={styles.container}>
      <h3><FormattedMessage {...messages.title} /></h3>

      <form onSubmit={onSubmit} noValidate>
        <div className={styles.fields}>
          <div>
            <FormControl id="login-email" type="email" {...email} />
          </div>
          <div>
            <FormControl id="login-password" type="password" {...password} />
          </div>
        </div>
        <Button
          type="button"
          flat
          disabled={process}
          onClick={onRegister}
          label={formatMessage(messages.registerButton)}
        />
        <Button
          type="submit"
          flat
          disabled={process}
          label={
            process
              ? formatMessage(messages.processButton)
              : formatMessage(messages.button)
          }
          primary
        />
      </form>

      <div className={styles.social}>
        <Button
          onClick={onGoogle}
          icon={`social ${fonts['icon-google']}`}
          tooltip="Google"
        >Google</Button>
        <Button
          onClick={onFacebook}
          icon={`social ${fonts['icon-facebook']}`}
          tooltip="Facebook"
        >Facebook</Button>
        <Button
          onClick={onTwitter}
          icon={`social ${fonts['icon-twitter']}`}
          tooltip="Twitter"
        >Twitter</Button>
      </div>
    </div>
  );
};

LoginForm.propTypes = {
  form: React.PropTypes.object.isRequired,
  intl: React.PropTypes.object.isRequired,
  process: React.PropTypes.bool.isRequired,
  login: React.PropTypes.func.isRequired,
  go: React.PropTypes.func.isRequired,
  onSuccess: React.PropTypes.func,
  onError: React.PropTypes.func,
};

const selector = createSelector(state => state, state => ({ process: state.auth.process }));

LoginForm = reduxForm({
  form: 'login',
  propNamespace: 'form',
  returnRejectedSubmitPromise: true,
  fields,
}, selector)(LoginForm);

export default LoginForm = injectIntl(LoginForm);
