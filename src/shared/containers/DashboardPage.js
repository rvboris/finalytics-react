import React from 'react';
import { connect } from 'react-redux';
import { createSelector } from 'reselect';

const dashboardPage = () => (
  <span>Dashboard</span>
);

const selector = createSelector(state => state, state => state);
export default connect(selector)(dashboardPage);
