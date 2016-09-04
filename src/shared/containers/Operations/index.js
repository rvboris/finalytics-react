import React from 'react';
import { connect } from 'react-redux';
import { createSelector } from 'reselect';

const Operations = () => (
  <div>Operations</div>
);

const selector = createSelector(
  state => state,
  (state) => state,
);

export default connect(selector)(Operations);
