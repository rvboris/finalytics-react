import React from 'react';
import VirtualizedSelect from 'react-virtualized-select';
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
  const { intl, input, virtualized, options } = props;
  const formatMessage = intl.formatMessage;

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

  if (virtualized) {
    return (
      <VirtualizedSelect
        {...props}
        value={input.value || ''}
        onBlur={onBlur}
        onChange={onChange}
        options={options}
        noResultsText={formatMessage(messages.notFoud)}
        instanceId={input.name}
        maxHeight={300}
      />
    );
  }

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
  intl: React.PropTypes.object.isRequired,
  input: React.PropTypes.object.isRequired,
  options: React.PropTypes.array.isRequired,
  virtualized: React.PropTypes.bool,
};

SelectInput.defaultProps = {
  virtualized: true,
};

export default injectIntl(SelectInput);
