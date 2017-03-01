import React from 'react';
import { connect } from 'react-redux';
import { createSelector } from 'reselect';
import { reduxForm, Field, SubmissionError } from 'redux-form';
import { mapValues, get, memoize, omit } from 'lodash';
import { push } from 'react-router-redux';
import { defineMessages, injectIntl, FormattedMessage } from 'react-intl';
import {
  Button,
  Form,
  FormGroup,
  FormFeedback,
  Label,
  Input,
  Alert,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from 'reactstrap';

import config from '../../config';
import timezones from './timezones';
import { error } from '../../log';
import { authActions } from '../../actions';
import validationHandler from '../../utils/validation-handler';
import SelectInput from '../SelectInput';
import style from './style.css';

const messages = defineMessages({
  email: {
    label: {
      id: 'component.profileEditForm.email.label',
      description: 'Label of email field',
      defaultMessage: 'Email',
    },
  },
  locale: {
    label: {
      id: 'component.profileEditForm.locale.label',
      description: 'Label of locale field',
      defaultMessage: 'Locale',
    },
  },
  baseCurrency: {
    label: {
      id: 'component.profileEditForm.baseCurrency.label',
      description: 'Label of baseCurrency field',
      defaultMessage: 'Base currency',
    },
    placeholder: {
      id: 'component.profileEditForm.baseCurrency.placeholder',
      description: 'Placeholder of baseCurrency field',
      defaultMessage: 'Select base currency',
    },
  },
  timezone: {
    label: {
      id: 'component.profileEditForm.timezone.label',
      description: 'Label of timezone field',
      defaultMessage: 'Timezone',
    },
    placeholder: {
      id: 'component.profileEditForm.timezone.placeholder',
      description: 'Placeholder of timezone field',
      defaultMessage: 'Select your timezone',
    },
  },
  saveProcessButton: {
    id: 'component.profileEditForm.saveProcessButton',
    description: 'Label of button in process',
    defaultMessage: 'Saving...',
  },
  saveButton: {
    id: 'component.profileEditForm.saveButton',
    description: 'Label of save button',
    defaultMessage: 'Save',
  },
  deleteButton: {
    id: 'component.profileEditForm.deleteButton',
    description: 'Label of delete button',
    defaultMessage: 'Delete profile',
  },
  deleteProcessButton: {
    id: 'component.profileEditForm.deleteProcessButton',
    description: 'Label of delete button in process',
    defaultMessage: 'Deleting...',
  },
  deleteModalTitle: {
    id: 'component.profileEditForm.deleteModalTitle',
    description: 'Title of delete modal',
    defaultMessage: 'Delete profile',
  },
  deleteModalConfirm: {
    id: 'component.profileEditForm.deleteModalConfirm',
    description: 'Confirm text to delete profile',
    defaultMessage: 'Are you sure want to delete your profile {email}?',
  },
  deleteModalWarning: {
    id: 'component.profileEditForm.deleteModalWarning',
    description: 'Warning text to delete profile',
    defaultMessage: 'WARNING, this operation can not be canceled.',
  },
  deleteModalError: {
    id: 'component.profileEditForm.deleteModalError',
    description: 'Delete profile error text',
    defaultMessage: 'When you delete an profile error occurred',
  },
  cancelButton: {
    id: 'component.profileEditForm.cancelButton',
    description: 'Label of cancel button',
    defaultMessage: 'Cancel',
  },
});

const SelectFormField = field =>
  <FormGroup color={field.meta.error ? 'danger' : null}>
    <Label>{field.label}</Label>
    <SelectInput
      {...field}
      options={field.options}
      clearable={false}
    />
    {field.meta.touched && field.meta.error && <FormFeedback>{field.meta.error}</FormFeedback>}
  </FormGroup>;

const defaultValues = {
  locale: null,
  baseCurrency: null,
  timezone: null,
};

const getTimezoneList = memoize(() =>
  timezones.map(({ id, text }) => ({
    value: id,
    label: text,
  }))
);

class ProfileEditForm extends React.Component {
  static propTypes = {
    form: React.PropTypes.object.isRequired,
    intl: React.PropTypes.object.isRequired,
    process: React.PropTypes.bool.isRequired,
    setSettings: React.PropTypes.func.isRequired,
    removeProfile: React.PropTypes.func.isRequired,
    goToRegister: React.PropTypes.func.isRequired,
    localeList: React.PropTypes.array.isRequired,
    currencyList: React.PropTypes.array.isRequired,
  };

  constructor(...args) {
    super(...args);

    this.state = {
      profileDeleteModal: false,
      profileDeleteError: false,
    };
  }

  getSubmitButton = () => {
    const { process } = this.props;
    const { pristine, submitting } = this.props.form;
    const disabled = pristine || submitting || this.props.process;

    let label;

    if (submitting || process) {
      label = <FormattedMessage {...messages.saveProcessButton} />;
    } else {
      label = <FormattedMessage {...messages.saveButton} />;
    }

    return (<Button type="submit" color="primary" disabled={disabled}>{label}</Button>);
  };

  getDeleteButton = () => (
    <Button className="float-right" color="danger" onClick={this.toggleModal}>
      <FormattedMessage {...messages.deleteButton} />
    </Button>
  );

  submitHandler = (values) => {
    const { setSettings, intl } = this.props;
    const filteredValues = omit(values, ['email']);
    const toValidate = Object.assign({}, defaultValues, filteredValues);

    toValidate.timezone = timezones[toValidate.timezone].offset;

    return new Promise(async (resolve, reject) => {
      let result;

      try {
        result = await setSettings(toValidate);
      } catch (err) {
        const validationResult =
          mapValues(validationHandler(toValidate, err), val => intl.formatMessage({ id: val }));

        reject(new SubmissionError(validationResult));

        return;
      }

      resolve(result);
    });
  };

  toggleModal = () => {
    this.setState({ profileDeleteModal: !this.state.profileDeleteModal });
  };

  removeProfile = () => {
    const { removeProfile, goToRegister } = this.props;

    return removeProfile()
      .then(() => {
        this.toggleModal();
        goToRegister();
      }, (e) => {
        error(e);
        this.setState(Object.assign(this.state, { profileDeleteError: true }));
      });
  }

  render() {
    const { currencyList, localeList, process } = this.props;
    const { formatMessage } = this.props.intl;
    const { handleSubmit, error: formError, initialValues } = this.props.form;

    const timezoneList = getTimezoneList();

    const deleteConfirmMessage =
      (<FormattedMessage
        {
        ...Object.assign(messages.deleteModalConfirm,
          { values: { email: (<strong>{initialValues.email}</strong>) } }
        )
        }
      />);

    return (
      <div className={style['form-container']}>
        <Form onSubmit={handleSubmit(this.submitHandler)} noValidate>
          <FormGroup>
            <Label><FormattedMessage {...messages.email.label} /></Label>
            <Input type="email" value={initialValues.email} disabled />
          </FormGroup>

          <Field
            label={formatMessage(messages.locale.label)}
            name="locale"
            options={localeList}
            component={SelectFormField}
          />

          <Field
            label={formatMessage(messages.baseCurrency.label)}
            name="baseCurrency"
            options={currencyList}
            component={SelectFormField}
          />

          <Field
            name="timezone"
            label={formatMessage(messages.timezone.label)}
            placeholder={formatMessage(messages.timezone.placeholder)}
            options={timezoneList}
            component={SelectFormField}
          />

          { formError && <Alert color="danger">{formError}</Alert> }

          <div>
            { this.getSubmitButton() }
            { this.getDeleteButton() }
          </div>
        </Form>

        <Modal isOpen={this.state.profileDeleteModal} toggle={this.toggleModal}>
          <ModalHeader toggle={this.toggleModal}>
            <FormattedMessage {...messages.deleteModalTitle} />
          </ModalHeader>
          <ModalBody>
            <p>{deleteConfirmMessage}</p>
            <Alert color="danger"><FormattedMessage {...messages.deleteModalWarning} /></Alert>
          </ModalBody>
          <ModalFooter>
            { this.state.profileDeleteError &&
              <p className="text-danger">
                <FormattedMessage {...messages.deleteModalError} />
              </p>
            }

            <Button
              type="button"
              onClick={this.removeProfile}
              disabled={process}
              color="danger"
              className="mr-3"
            >
              {
                this.props.process
                  ? <FormattedMessage {...messages.deleteProcessButton} />
                  : <FormattedMessage {...messages.deleteButton} />
              }
            </Button>

            <Button type="button" onClick={this.toggleModal} disabled={process}>
              <FormattedMessage {...messages.cancelButton} />
            </Button>
          </ModalFooter>
        </Modal>
      </div>
    );
  }
}

let profileForm = reduxForm({
  form: 'ProfileEditForm',
  propNamespace: 'form',
  enableReinitialize: true,
})(ProfileEditForm);

const processSelector = createSelector(
  state => get(state, 'auth.process', false),
  process => process,
);

const localeListSelector = createSelector(
  state => get(state, 'locale.availableLocales', []),
  localeList => localeList.map(locale => ({
    value: locale.key,
    label: locale.name,
  })),
);

const currencyListSelector = createSelector(
  state => get(state, 'currency.currencyList', []),
  currencyList => currencyList.map(currency => ({
    value: currency._id,
    label: `${currency.translatedName} (${currency.code})`,
  })),
);

const profileDefaultsSelector = createSelector(
  state => get(state, 'auth.profile.email'),
  state => get(state, 'locale.currentLocale', config.defaultLocale),
  state => get(state, 'auth.profile.settings.baseCurrency'),
  state => get(state, 'auth.profile.settings.timezone'),
  (email, locale, baseCurrency, timezone) => {
    const tz = timezones.find(({ offset }) => offset === timezone) || {};

    return {
      email,
      locale,
      baseCurrency,
      timezone: tz.id,
    };
  }
);

const selector = createSelector([
  processSelector,
  localeListSelector,
  currencyListSelector,
  profileDefaultsSelector,
], (process, localeList, currencyList, initialValues) => ({
  process,
  localeList,
  currencyList,
  initialValues,
}));

const mapDispatchToProps = dispatch => ({
  setSettings: (...args) => dispatch(authActions.setSettings(...args)),
  removeProfile: () => dispatch(authActions.removeProfile()),
  goToRegister: () => dispatch(push('/register')),
});

profileForm = connect(selector, mapDispatchToProps)(profileForm);

export default injectIntl(profileForm);
