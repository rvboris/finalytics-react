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
        <AppBar />
        <div className="container">{ this.props.children }</div>
      </div>
    );
  }
}

export default Dashboard;
