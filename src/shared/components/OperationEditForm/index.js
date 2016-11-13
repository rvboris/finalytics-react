import React from 'react';
import { connect } from 'react-redux';
import { createSelector } from 'reselect';
import { Card, CardHeader, CardBlock } from 'reactstrap';
import { reduxForm, Field } from 'redux-form';
import { get } from 'lodash';
import { injectIntl } from 'react-intl';

import config from '../../config';
import { operationActions } from '../../actions';
import DatePicker from '../DatePicker';
import style from './style.css';

class OperationEditForm extends React.Component {
  static propTypes = {
    operationId: React.PropTypes.string,
    process: React.PropTypes.bool.isRequired,
    isNewOperation: React.PropTypes.bool.isRequired,
    form: React.PropTypes.object.isRequired,
    intl: React.PropTypes.object.isRequired,
    createOperation: React.PropTypes.func.isRequired,
    saveOperation: React.PropTypes.func.isRequired,
    removeOperation: React.PropTypes.func.isRequired,
    locale: React.PropTypes.string.isRequired,
  };

  constructor(props) {
    super(props);

    this.setState({});
  }

  render() {
    const { locale } = this.props;

    return (
      <Card>
        <CardHeader>Добавить операцию</CardHeader>
        <CardBlock>
          <div className={style['datepicker-container']}>
            <Field
              name="date"
              locale={locale}
              component={DatePicker}
            />
          </div>
        </CardBlock>
      </Card>
    );
  }
}

let operationForm = reduxForm({
  form: 'operationEdit',
  propNamespace: 'form',
  enableReinitialize: true,
})(OperationEditForm);

const mapDispatchToProps = dispatch => ({
  saveOperation: (...args) => dispatch(operationActions.save(...args)),
  createOperation: (...args) => dispatch(operationActions.create(...args)),
  removeOperation: (...args) => dispatch(operationActions.remove(...args)),
});

const localeSelector = createSelector(
  state => get(state, 'auth.profile.settings.locale', config.defaultLang),
  locale => locale,
);

const selector = createSelector(
  localeSelector,
  locale => ({ locale })
);

operationForm = connect(selector, mapDispatchToProps)(operationForm);

export default injectIntl(operationForm);
