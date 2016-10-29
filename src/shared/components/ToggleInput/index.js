import React from 'react';
import Toggle from 'react-toggle';

import 'react-toggle/style.css';
import './style.css';

const ToggleInput = (props) => {
  const onChange = (event) => {
    if (props.input.onChange && event) {
      props.input.onChange(event.target.checked);
    }
  };

  return (
    <Toggle
      onChange={onChange}
      checked={props.input.value}
    />
  );
};

ToggleInput.propTypes = {
  input: React.PropTypes.object.isRequired,
};

export default ToggleInput;
