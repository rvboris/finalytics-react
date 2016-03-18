import React from 'react';
import { connect } from 'react-redux';
import { createSelector } from 'reselect';

const homePage = () => (<span>Home</span>);

const selector = createSelector(state => state, state => state);
export default connect(selector)(homePage);
