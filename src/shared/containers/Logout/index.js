import React from 'react';
import { connect } from 'react-redux';
import { push } from 'react-router-redux';
import { createSelector } from 'reselect';
import { get } from 'lodash';
import { defineMessages, FormattedMessage, injectIntl } from 'react-intl';

import { authActions } from '../../actions';
import Spinner from '../../components/Spinner';
import styles from './style.css';

const messages = defineMessages({
  done: {
    id: 'container.logout.done',
    description: 'Logout exit message',
    defaultMessage: 'The logout is complete',
  },
  process: {
    id: 'container.logout.process',
    description: 'Logout process message',
    defaultMessage: 'Logout...',
  },
});

class Logout extends React.Component {
  static propTypes = {
    logout: React.PropTypes.func.isRequired,
    goToLogin: React.PropTypes.func.isRequired,
    process: React.PropTypes.bool.isRequired,
  };

  componentDidMount() {
    const { logout, goToLogin } = this.props;
    logout().finally(Promise.delay(2000).then(goToLogin));
  }

  render() {
    const { process } = this.props;

    return (
      <div className={styles.logout}>
        <Spinner />
        {
          process
            ? <h4 className="mt-1"><FormattedMessage {...messages.process} /></h4>
            : <h4 className="mt-1"><FormattedMessage {...messages.done} /></h4>
        }
      </div>
    );
  }
}

const mapDispatchToProps = (dispatch) => ({
  logout: () => dispatch(authActions.logout()),
  goToLogin: () => dispatch(push('/login')),
});

const selector = createSelector(
  state => get(state, 'auth.process', false),
  process => ({ process }),
);

export default injectIntl(connect(selector, mapDispatchToProps)(Logout));
