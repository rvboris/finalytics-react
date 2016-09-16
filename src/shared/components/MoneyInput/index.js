import React from 'react';

const getCursorPosition = (element) => {
  if (element.selectionStart) {
    return element.selectionStart;
  } else if (document.selection) {
    element.focus();
    const r = document.selection.createRange();

    if (r == null) {
      return 0;
    }

    const re = element.createTextRange();
    const rc = re.duplicate();

    re.moveToBookmark(r.getBookmark());
    rc.setEndPoint('EndToStart', re);

    return rc.text.length;
  }

  return 0;
};

const checkValue = (event, currentValue) => {
  const inputCode = event.which;

  if (inputCode > 0 && (inputCode < 48 || inputCode > 57)) {
    if (inputCode === 46) {
      if (getCursorPosition(event.target) === 0 && currentValue.charAt(0) === '-') {
        event.preventDefault();
      }
      if (currentValue.match(/[.]/)) {
        event.preventDefault();
      }
    } else if (inputCode === 45) {
      if (currentValue.charAt(0) === '-') {
        event.preventDefault();
      }

      if (getCursorPosition(event.target) !== 0) {
        event.preventDefault();
      }
    } else if (inputCode === 8) {
      console.log('ok');
    } else {
      event.preventDefault();
    }
  } else if (inputCode > 0 && (inputCode >= 48 && inputCode <= 57)) {
    if (currentValue.charAt(0) === '-' && getCursorPosition(event.target) === 0) {
      event.preventDefault();
    }
  }
};

const MoneyInput = (props) => {
  const onKeyPress = (event) => checkValue(event, props.input.value.toString());

  const onChange = (event) => {
    const parseValue = parseFloat(event.target.value);

    if (!Number.isFinite(parseValue)) {
      event.preventDefault();
    }

    if (props.input.onChange) {
      props.input.onChange(event.target.value);
    }
  };

  return (
    <input
      {...props.input}
      type="text"
      className={props.className}
      onKeyPress={onKeyPress}
      onChange={onChange}
    />
  );
};

MoneyInput.propTypes = {
  input: React.PropTypes.object.isRequired,
  className: React.PropTypes.string,
};

export default MoneyInput;
