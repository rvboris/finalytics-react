import React from 'react';
import { connect } from 'react-redux';
import { push } from 'react-router-redux';
import { createSelector } from 'reselect';
import { Button } from 'react-bootstrap';

const goToMain = (dispatch) => () => dispatch(push('/dashboard'));
const goToLogout = (dispatch) => () => dispatch(push('/logout'));

class DashboardPage extends React.Component {
  static propTypes = {
    dispatch: React.PropTypes.func.isRequired,
    profile: React.PropTypes.object.isRequired,
  };

  state = {
    drawerActive: false,
  };

  toggleDrawerActive = () => {
    this.setState({ drawerActive: !this.state.drawerActive });
  };

  render() {
    return (
      <div>
        <Button onClick={goToMain(this.props.dispatch)}>Main</Button>
        <Button onClick={goToLogout(this.props.dispatch)}>Logout</Button>
      </div>
    );
  }
}

const selector = createSelector(
  state => state,
  (state) => ({ profile: state.auth.profile })
);

export default connect(selector)(DashboardPage);
