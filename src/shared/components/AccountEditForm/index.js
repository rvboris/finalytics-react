import React from 'react';
import { connect } from 'react-redux';
import { Alert } from 'react-bootstrap';

const AccountEditForm = (props) => {
  if (!props.accountId) {
    return (<Alert>Выберите счет для редактирования</Alert>);
  }

  return (
    <div>Форма редактирования</div>
  );
};

AccountEditForm.propTypes = {
  accountId: React.PropTypes.string,
};

export default connect(null)(AccountEditForm);
