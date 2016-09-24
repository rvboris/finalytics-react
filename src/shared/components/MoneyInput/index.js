import React from 'react';

const getCursorPosition = (element) => {
  if (element.selectionStart) {
    return element.selectionStart;
  }

  if (document.selection) {
    element.focus();

    const range = document.selection.createRange();

    if (!range) {
      return 0;
    }

    const textRange = element.createTextRange();
    const dupRange = textRange.duplicate();

    textRange.moveToBookmark(range.getBookmark());
    dupRange.setEndPoint('EndToStart', textRange);

    return dupRange.text.length;
  }

  return 0;
};

const checkValue = (event, currentValue) => {
  const inputCode = event.which;

  if (inputCode > 0 && (inputCode < 48 || inputCode > 57)) {
    if (inputCode === 46) {
      if ((getCursorPosition(event.target) === 0 && currentValue.charAt(0) === '-') || currentValue.match(/[.]/)) {
        event.preventDefault();
      }
    } else if (inputCode === 45) {
      if (currentValue.charAt(0) === '-' || getCursorPosition(event.target) !== 0) {
        event.preventDefault();
      }
    } else if (inputCode !== 8) {
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
