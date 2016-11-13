import React from 'react';
import DayPicker, { DateUtils } from 'react-day-picker';
import LocaleUtils from 'react-day-picker/moment';

const DatePicker = (props) => {
  const onChange = (event, date) => {
    if (props.input.onChange && event) {
      props.input.onChange(date.toString());
    }
  };

  const selectedDays = (day) => DateUtils.isSameDay(new Date(props.input.value), day);

  return (
    <DayPicker
      localeUtils={LocaleUtils}
      locale={props.locale}
      onDayClick={onChange}
      selectedDays={selectedDays}
    />
  );
};

DatePicker.propTypes = {
  input: React.PropTypes.object.isRequired,
  locale: React.PropTypes.string.isRequired,
};

export default DatePicker;
