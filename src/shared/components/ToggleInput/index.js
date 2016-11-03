import React from 'react';
import Toggle from 'react-toggle';

import './style.css';

const ToggleInput = (props) => {
  const onChange = (event) => {
    if (props.input.onChange && event) {
      props.input.onChange(event.target.checked);
    }
  };

  return (
    <Toggle
      disabled={props.disabled}
      onChange={onChange}
      checked={props.input.value}
    />
  );
};

ToggleInput.propTypes = {
  input: React.PropTypes.object.isRequired,
  disabled: React.PropTypes.bool,
};

export default ToggleInput;
