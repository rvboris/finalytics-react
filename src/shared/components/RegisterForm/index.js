import React from 'react';
import { connect } from 'react-redux';
import { createSelector } from 'reselect';
import { reduxForm, Field, SubmissionError } from 'redux-form';
import { mapValues } from 'lodash';
import { defineMessages, FormattedMessage, injectIntl } from 'react-intl';
import FaFacebookIcon from 'react-icons/lib/fa/facebook';
import FaGoogleIcon from 'react-icons/lib/fa/google';
import FaTwitterIcon from 'react-icons/lib/fa/twitter';
import {
  Button,
  ButtonGroup,
  Form,
  FormGroup,
  FormFeedback,
  Label,
  Input,
  Alert,
  Card,
  CardHeader,
  CardBlock,
} from 'reactstrap';

import style from './style.css';
import validationHandler from '../../utils/validation-handler';

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

const FormField = (field) =>
  <FormGroup color={field.meta.error ? 'danger' : null}>
    <Label>{field.label}</Label>
    <Input
      type={field.type}
      placeholder={field.placeholder}
      {...field.input}
    />
    {field.meta.touched && field.meta.error && <FormFeedback>{field.meta.error}</FormFeedback>}
  </FormGroup>;

let RegisterForm = (props) => {
  const {
    form: { error, handleSubmit, pristine, submitting },
    intl: { formatMessage },
    process,
    register,
    onSuccess,
    onError,
  } = props;

  const defaultValues = {
    email: null,
    password: null,
    repeatPassword: null,
  };

  const submitHandler = (values) =>
    new Promise(async (resolve, reject) => {
      let result;

      const toValidate = Object.assign({}, defaultValues, values);

      try {
        result = await register(toValidate);
      } catch (err) {
        const validationResult =
          mapValues(validationHandler(toValidate, err), (val) => formatMessage({ id: val }));

        reject(new SubmissionError(validationResult));
        return;
      }

      resolve(result.data.token);
    }).then(onSuccess, onError);

  return (
    <div className={style.container}>
      <Card className={style['register-form']}>
        <CardHeader><FormattedMessage {...messages.title} /></CardHeader>
        <CardBlock>
          <Form onSubmit={handleSubmit(submitHandler)} noValidate>
            <Field
              name="email"
              label={formatMessage(messages.email.label)}
              placeholder={formatMessage(messages.email.placeholder)}
              component={FormField}
              type="email"
            />

            <Field
              name="password"
              label={formatMessage(messages.password.label)}
              placeholder={formatMessage(messages.password.placeholder)}
              component={FormField}
              type="password"
            />

            <Field
              name="repeatPassword"
              label={formatMessage(messages.repeatPassword.label)}
              placeholder={formatMessage(messages.repeatPassword.placeholder)}
              component={FormField}
              type="password"
            />

            { error && <Alert color="danger">{error}</Alert> }

            <Button
              type="submit"
              color="primary"
              disabled={pristine || submitting || process}
              className={style['submit-button']}
              block
            >{process
              ? <FormattedMessage {...messages.processButton} />
              : <FormattedMessage {...messages.button} />
            }</Button>
          </Form>

          <ButtonGroup className="btn-group-justified">
            <Button type="button" onClick={onGoogle}>
              <FaGoogleIcon size={30} />
            </Button>

            <Button type="button" onClick={onFacebook}>
              <FaFacebookIcon size={30} />
            </Button>

            <Button type="button" onClick={onTwitter}>
              <FaTwitterIcon size={30} />
            </Button>
          </ButtonGroup>
        </CardBlock>
      </Card>
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

const selector = createSelector(state => state.auth.process, process => ({ process }));

RegisterForm = reduxForm({ form: 'register', propNamespace: 'form' })(RegisterForm);
RegisterForm = connect(selector)(RegisterForm);

export default injectIntl(RegisterForm);
