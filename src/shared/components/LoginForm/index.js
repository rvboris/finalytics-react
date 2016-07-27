import React from 'react';
import { createSelector } from 'reselect';
import { reduxForm } from 'redux-form';
import { each, noop, pick } from 'lodash';
import { defineMessages, injectIntl, FormattedMessage } from 'react-intl';
import validationHandler from '../../utils/validation-handler';
import TiSocialFacebook from 'react-icons/lib/ti/social-facebook';
import TiSocialGooglePlus from 'react-icons/lib/ti/social-google-plus';
import TiSocialTwitter from 'react-icons/lib/ti/social-twitter';

import style from './style.css';

import {
  Button,
  FormControl,
  FormGroup,
  ControlLabel,
  Panel,
  ButtonGroup,
  HelpBlock,
} from 'react-bootstrap';

const messages = defineMessages({
  title: {
    id: 'auth.login.title',
    description: 'Login dialog title',
    defaultMessage: 'Login',
  },
  email: {
    placeholder: {
      id: 'auth.login.email.placeholder',
      description: 'Login dialog email hint',
      defaultMessage: 'example@domain.com',
    },
    label: {
      id: 'auth.login.email.label',
      description: 'Login dialog email float hint',
      defaultMessage: 'Enter your email',
    },
  },
  password: {
    placeholder: {
      id: 'auth.login.password.placeholder',
      description: 'Login dialog password hint',
      defaultMessage: 'strong password',
    },
    label: {
      id: 'auth.login.password.label',
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

const fields = ['email', 'password'];
const errors = { email: {}, password: {} };

const onGoogle = () => {
  window.location.pathname = '/api/auth/google';
};

const onFacebook = () => {
  window.location.pathname = '/api/auth/facebook';
};

const onTwitter = () => {
  window.location.pathname = '/api/auth/twitter';
};

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
    if (field.touched && field.error) {
      errors[fieldName].error = formatMessage({ id: field.error });
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
    each(errors, (field) => {
      delete field.error;
    });

    handleSubmit(submitHandler)(e).then(onSuccess || noop, onError || noop);
  };

  const onRegister = () => go('/register');

  return (
    <div className={style.container}>
      <Panel header={formatMessage(messages.title)} className={style['login-form']}>
        <form onSubmit={onSubmit} noValidate>
          <FormGroup controlId="email" validationState={errors.email.error ? 'error' : null}>
            <ControlLabel><FormattedMessage {...messages.email.label} /></ControlLabel>
            <FormControl
              type="email"
              placeholder={formatMessage(messages.email.placeholder)}
              {...pick(email, ['value', 'onChange'])}
            />
            <FormControl.Feedback />
            <HelpBlock>{errors.email.error}</HelpBlock>
          </FormGroup>

          <FormGroup controlId="password" validationState={errors.password.error ? 'error' : null}>
            <ControlLabel><FormattedMessage {...messages.password.label} /></ControlLabel>
            <FormControl
              type="password"
              placeholder={formatMessage(messages.password.placeholder)}
              {...pick(password, ['value', 'onChange'])}
            />
            <FormControl.Feedback />
            <HelpBlock>{errors.password.error}</HelpBlock>
          </FormGroup>

          <div className={style['action-buttons']}>
            <Button
              type="button"
              disabled={process}
              onClick={onRegister}
            >
              <FormattedMessage {...messages.registerButton} />
            </Button>
            <Button
              type="submit"
              bsStyle="primary"
              disabled={process}
            >{process
              ? <FormattedMessage {...messages.processButton} />
              : <FormattedMessage {...messages.button} />
            }</Button>
          </div>
        </form>

        <ButtonGroup justified>
          <ButtonGroup>
            <Button type="button" onClick={onGoogle}>
              <TiSocialGooglePlus size={30} />
            </Button>
          </ButtonGroup>

          <ButtonGroup>
            <Button type="button" onClick={onFacebook}>
              <TiSocialFacebook size={30} />
            </Button>
          </ButtonGroup>

          <ButtonGroup>
            <Button type="button" onClick={onTwitter}>
              <TiSocialTwitter size={30} />
            </Button>
          </ButtonGroup>
        </ButtonGroup>
      </Panel>
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
