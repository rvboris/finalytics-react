import React from 'react';

import style from './style.css';

const Spinner = ({ color = '#000', size = 50 }) => {
  const styleSize = {
    width: `${size}px`,
    height: `${size}px`,
  };

  const styleColor = {
    borderColor: color,
  };

  return (
    <div className={style.spinner} style={styleSize}>
      <div className={style['circle-1']} style={styleColor} />
      <div className={style['circle-2']} style={styleColor} />
      <div className={style['circle-3']} style={styleColor} />
    </div>
  );
};

Spinner.propTypes = {
  color: React.PropTypes.string,
  size: React.PropTypes.number,
};

export default Spinner;
