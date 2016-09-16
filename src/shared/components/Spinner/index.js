import React from 'react';

import style from './style.css';

const Spinner = (props) => {
  const color = props.color || '#000';
  const size = props.size || 50;

  const styleSize = {
    width: `${size}px`,
    height: `${size}px`,
  };

  const styleColor = {
    'border-color': color,
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
