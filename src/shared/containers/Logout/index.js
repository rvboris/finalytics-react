import React from 'react';
import { connect } from 'react-redux';
import { push } from 'react-router-redux';
import { createSelector } from 'reselect';
import { defineMessages, FormattedMessage } from 'react-intl';

import { authActions } from '../../actions';
import styles from './style.css';

const messages = defineMessages({
  done: {
    id: 'auth.logout.done',
    description: 'Logout exit message',
    defaultMessage: 'The logout is complete, return to the main page...',
  },
});

class Logout extends React.Component {
  static propTypes = {
    dispatch: React.PropTypes.func.isRequired,
    process: React.PropTypes.bool.isRequired,
  }

  componentDidMount() {
    this.props.dispatch(authActions.logout()).finally(this.startTimeout.bind(this));
  }

  startTimeout() {
    if (IS_CLIENT) {
      setTimeout(() => this.props.dispatch(push('/')), 2000);
    }
  }

  render() {
    const { process } = this.props;

    return (
      <div className={styles.container}>
        {
          process
            ? <p>Process</p>
            : <h1><FormattedMessage {...messages.done} /></h1>
        }
      </div>
    );
  }
}

const selector = createSelector(state => state.auth.process, process => ({ process }));
export default connect(selector)(Logout);
