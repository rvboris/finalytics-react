import React from 'react';
import { connect } from 'react-redux';
import { push } from 'react-router-redux';
import { createSelector } from 'reselect';
import { defineMessages, FormattedMessage } from 'react-intl';

import CircularProgress from 'material-ui/lib/circular-progress';

import { authActions } from '../actions';
import styles from './LogoutPage.css';

const messages = defineMessages({
  done: {
    id: 'auth.logout.done',
    description: 'Logout exit message',
    defaultMessage: 'The logout is complete, return to the main page...',
  },
});

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
      <div className={ styles.container }>
        {
          process
            ? <CircularProgress size={2} />
            : <h1><FormattedMessage { ...messages.done } /></h1>
        }
      </div>
    );
  }
}

const selector = createSelector(state => ({ process: state.auth.process }), state => state);
export default connect(selector)(LogoutPage);
