import React from 'react';
import Select from 'react-select';
import { defineMessages, injectIntl } from 'react-intl';

import './style.css';

const messages = defineMessages({
  notFoud: {
    id: 'component.selectInput.notFound',
    description: 'Not found message',
    defaultMessage: 'Not found',
  },
});

const SelectInput = (props) => {
  const formatMessage = props.intl.formatMessage;

  const onChange = (event) => {
    if (props.input.onChange && event) {
      props.input.onChange(event.value);
    }
  };

  const onBlur = () => {
    if (props.input.onBlur) {
      props.input.onBlur(props.input.value);
    }
  };

  return (
    <Select
      {...props}
      value={props.input.value || ''}
      onBlur={onBlur}
      onChange={onChange}
      options={props.options}
      noResultsText={formatMessage(messages.notFoud)}
    />
  );
};

SelectInput.propTypes = {
  intl: React.PropTypes.object.isRequired,
  input: React.PropTypes.object.isRequired,
  options: React.PropTypes.array.isRequired,
};

export default injectIntl(SelectInput);
