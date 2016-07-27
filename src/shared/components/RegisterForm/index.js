import React from 'react';
import { createSelector } from 'reselect';
import { reduxForm } from 'redux-form';
import { each, noop, pick } from 'lodash';
import { defineMessages, FormattedMessage, injectIntl } from 'react-intl';
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
    id: 'auth.register.title',
    description: 'Register dialog title',
    defaultMessage: 'Register',
  },
  email: {
    placeholder: {
      id: 'auth.register.email.placeholder',
      description: 'Register dialog email hint',
      defaultMessage: 'your@email.com',
    },
    label: {
      id: 'auth.register.email.label',
      description: 'Register dialog email float hint',
      defaultMessage: 'Enter your email',
    },
  },
  password: {
    placeholder: {
      id: 'auth.register.password.placeholder',
      description: 'Register dialog password hint',
      defaultMessage: 'strong password',
    },
    label: {
      id: 'auth.register.password.label',
      description: 'Register dialog password float hint',
      defaultMessage: 'Enter your password',
    },
  },
  repeatPassword: {
    placeholder: {
      id: 'auth.register.repeatPassword.placeholder',
      description: 'Register dialog password repeat hint',
      defaultMessage: 'repeat password',
    },
    label: {
      id: 'auth.register.repeatPassword.label',
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

const fields = ['email', 'password', 'repeatPassword'];
const errors = { email: {}, password: {}, repeatPassword: {} };

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
    if (field.touched && field.error) {
      errors[fieldName].error = formatMessage({ id: field.error });
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
    each(errors, (field) => {
      delete field.error;
    });

    handleSubmit(submitHandler)(e).then(onSuccess || noop, onError || noop);
  };

  return (
    <div className={style.container}>
      <Panel header={formatMessage(messages.title)} className={style['register-form']}>
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

          <FormGroup
            controlId="repeatPassword"
            validationState={errors.repeatPassword.error ? 'error' : null}
          >
            <ControlLabel><FormattedMessage {...messages.repeatPassword.label} /></ControlLabel>
            <FormControl
              type="password"
              placeholder={formatMessage(messages.repeatPassword.placeholder)}
              {...pick(repeatPassword, ['value', 'onChange'])}
            />
            <FormControl.Feedback />
            <HelpBlock>{errors.repeatPassword.error}</HelpBlock>
          </FormGroup>

          <Button
            type="submit"
            bsStyle="primary"
            disabled={process}
            className={style['submit-button']}
            block
          >{process
            ? <FormattedMessage {...messages.processButton} />
            : <FormattedMessage {...messages.button} />
          }</Button>
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

RegisterForm.propTypes = {
  form: React.PropTypes.object.isRequired,
  intl: React.PropTypes.object.isRequired,
  process: React.PropTypes.bool.isRequired,
  register: React.PropTypes.func.isRequired,
  onSuccess: React.PropTypes.func,
  onError: React.PropTypes.func,
};

const selector = createSelector(state => state, state => ({ process: state.auth.process }));

RegisterForm = reduxForm({
  form: 'register',
  propNamespace: 'form',
  returnRejectedSubmitPromise: true,
  fields,
}, selector)(RegisterForm);

export default RegisterForm = injectIntl(RegisterForm);
