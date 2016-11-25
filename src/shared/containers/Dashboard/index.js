import React from 'react';
import { connect } from 'react-redux';
import { createSelector } from 'reselect';

import { accountActions, categoryActions, currencyActions } from '../../actions';
import AppBar from '../../components/AppBar';
import Spinner from '../../components/Spinner';

class Dashboard extends React.Component {
  static needs = [
    accountActions.load,
    categoryActions.load,
    currencyActions.load,
  ];

  static propTypes = {
    children: React.PropTypes.object.isRequired,
    isReady: React.PropTypes.bool.isRequired,
  }

  render() {
    const { isReady } = this.props;

    if (!isReady) {
      return (
        <div><Spinner /></div>
      );
    }

    return (
      <div>
        <div className="container"><AppBar /></div>
        <div className="container mt-1">{ this.props.children }</div>
      </div>
    );
  }
}

const isReadySelector = createSelector(
  state => state.dashboard.ready,
  ready => ready,
);

const selector = createSelector(
  isReadySelector,
  isReady => ({ isReady })
);

export default connect(selector)(Dashboard);
