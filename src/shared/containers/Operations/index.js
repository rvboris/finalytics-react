import React from 'react';
import { connect } from 'react-redux';
import { createSelector } from 'reselect';

import AccountList from '../../components/AccountList';
import style from './style.css';

const Operations = () => (
  <div className={style.operations}>
    <div className={style['operations-container']}>123</div>
    <div className={style['balance-container']}><AccountList /></div>
  </div>
);

const selector = createSelector(
  state => state,
  state => state,
);

export default connect(selector)(Operations);
