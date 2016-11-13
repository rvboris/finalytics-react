import React from 'react';
import classnames from 'classnames';

import AccountList from '../../components/AccountList';
import OperationEditForm from '../../components/OperationEditForm';
import style from './style.css';

const Operations = () => (
  <div className={style.operations}>
    <div className={classnames(style['operations-container'], 'mr-2')}>
      <OperationEditForm />
    </div>
    <div className={style['balance-container']}>
      <AccountList />
    </div>
  </div>
);

export default Operations;
