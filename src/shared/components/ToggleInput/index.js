import React from 'react';
import Toggle from 'react-toggle';

import './style.css';

const ToggleInput = ({ input, disabled }) => {
  const onChange = (event) => {
    if (input.onChange && event) {
      input.onChange(event.target.checked);
    }
  };

  return (
    <Toggle
      disabled={disabled}
      onChange={onChange}
      checked={input.value}
    />
  );
};

ToggleInput.propTypes = {
  input: React.PropTypes.object.isRequired,
  disabled: React.PropTypes.bool,
};

ToggleInput.defaultProps = {
  disabled: false,
};

export default ToggleInput;
