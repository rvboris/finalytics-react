import PropTypes from 'prop-types';
import React from 'react';
import DayPicker, { DateUtils } from 'react-day-picker';
import LocaleUtils from 'react-day-picker/moment';
import moment from 'moment';

import './style.css';

const DatePicker = ({ locale, input }) => {
  const { value } = input;

  const handleDayClick = (day, { disabled, selected }) => {
    if (disabled || selected || !input.onChange) {
      return;
    }

    input.onChange(moment(day).utc().format());
  };

  const selectedDays = (day) => DateUtils.isSameDay(moment(value).utc().toDate(), day);

  return (
    <DayPicker
      localeUtils={LocaleUtils}
      locale={locale}
      onDayClick={handleDayClick}
      selectedDays={selectedDays}
      initialMonth={moment(value).utc().toDate()}
      ref={elm => {
        if (!elm) {
          return;
        }

        elm.showMonth(moment(value).utc().toDate());
      }}
    />
  );
};

DatePicker.propTypes = {
  input: PropTypes.object.isRequired,
  locale: PropTypes.string.isRequired,
};

export default DatePicker;
