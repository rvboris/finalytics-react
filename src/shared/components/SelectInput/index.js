import PropTypes from 'prop-types';
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
  const { intl, input, options } = props;
  const { formatMessage } = intl;

  const onChange = (event) => {
    if (input.onChange && event) {
      input.onChange(event.value);
    }
  };

  const onBlur = () => {
    if (input.onBlur) {
      input.onBlur(input.value);
    }
  };

  return (
    <Select
      {...props}
      value={input.value || ''}
      onBlur={onBlur}
      onChange={onChange}
      options={options}
      noResultsText={formatMessage(messages.notFoud)}
      instanceId={input.name}
    />
  );
};

SelectInput.propTypes = {
  intl: PropTypes.object.isRequired,
  input: PropTypes.object.isRequired,
  options: PropTypes.array.isRequired,
};

export default injectIntl(SelectInput);
