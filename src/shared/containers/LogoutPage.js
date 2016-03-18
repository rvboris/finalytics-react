import React from 'react';
import { connect } from 'react-redux';
import { push } from 'react-router-redux';
import { createSelector } from 'reselect';

import CircularProgress from 'material-ui/lib/circular-progress';

import { authActions } from '../actions';

class LogoutPage extends React.Component {
  static propTypes = {
    dispatch: React.PropTypes.func.isRequired,
    process: React.PropTypes.bool.isRequired,
  }

  componentDidMount() {
    this.props.dispatch(authActions.logout()).finally(this.startTimeout.bind(this));
  }

  startTimeout() {
    if (__CLIENT__) {
      setTimeout(() => this.props.dispatch(push('/')), 2000);
    }
  }

  render() {
    const { process } = this.props;

    return (
      <div>
        { process ? <CircularProgress size={2} /> : 'Ok' }
      </div>
    );
  }
}

const selector = createSelector(state => ({ process: state.auth.process }), state => state);
export default connect(selector)(LogoutPage);
