import React from 'react';
import DayPicker, { DateUtils } from 'react-day-picker';
import LocaleUtils from 'react-day-picker/moment';
import moment from 'moment';

import './style.css';

const DatePicker = ({ locale, input }) => {
  const { value } = input;

  const onChange = (event, date) => {
    if (input.onChange && event) {
      input.onChange(moment(date).utc().format());
    }
  };

  const selectedDays = (day) => DateUtils.isSameDay(moment(value).utc().toDate(), day);

  return (
    <DayPicker
      localeUtils={LocaleUtils}
      locale={locale}
      onDayClick={onChange}
      selectedDays={selectedDays}
      initialMonth={moment(value).utc().toDate()}
    />
  );
};

DatePicker.propTypes = {
  input: React.PropTypes.object.isRequired,
  locale: React.PropTypes.string.isRequired,
};

export default DatePicker;
