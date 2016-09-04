import React from 'react';

import AppBar from '../../components/AppBar';

const Dashboard = (props) => (
  <div>
    <AppBar />
    { props.children }
  </div>
);

Dashboard.propTypes = {
  children: React.PropTypes.object.isRequired,
};

export default Dashboard;
