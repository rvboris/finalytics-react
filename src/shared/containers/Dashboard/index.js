import React from 'react';

import { accountActions, categoryActions, currencyActions } from '../../actions';
import AppBar from '../../components/AppBar';

class Dashboard extends React.Component {
  static needs = [
    accountActions.load,
    categoryActions.load,
    currencyActions.load,
  ];

  static propTypes = {
    children: React.PropTypes.object.isRequired,
  }

  render() {
    return (
      <div>
        <div className="container"><AppBar /></div>
        <div className="container mt-1">{ this.props.children }</div>
      </div>
    );
  }
}

export default Dashboard;
