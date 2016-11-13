import React from 'react';
import { connect } from 'react-redux';
import { createSelector } from 'reselect';
import { Link } from 'react-router';
import {
  Navbar,
  NavbarBrand,
  Nav,
  NavItem,
} from 'reactstrap';
import { defineMessages, injectIntl, FormattedMessage } from 'react-intl';

const messages = defineMessages({
  operations: {
    id: 'component.appBar.operations',
    description: 'AppBar operations link',
    defaultMessage: 'Operations',
  },
  budget: {
    id: 'component.appBar.budget',
    description: 'AppBar budget link',
    defaultMessage: 'Budget',
  },
  reports: {
    id: 'component.appBar.reports',
    description: 'AppBar reports link',
    defaultMessage: 'Reports',
  },
  profile: {
    id: 'component.appBar.profile',
    description: 'AppBar profile link',
    defaultMessage: 'Profile',
  },
  exit: {
    id: 'component.appBar.exit',
    description: 'AppBar exit link',
    defaultMessage: 'Logout',
  },
});

const NavLink = (props) => (
  <Link {...props} className="nav-link" activeClassName="active">
    {props.children}
  </Link>
);

NavLink.propTypes = {
  children: React.PropTypes.any,
};

const AppBar = (props) => {
  const { userLogin } = props;

  return (
    <Navbar color="primary" dark>
      <NavbarBrand href="/dashboard/operations">Finalytics</NavbarBrand>
      <Nav navbar>
        <NavItem>
          <NavLink to="/dashboard/operations"><FormattedMessage {...messages.operations} /></NavLink>
        </NavItem>
        <NavItem>
          <NavLink to="/dashboard/budget"><FormattedMessage {...messages.budget} /></NavLink>
        </NavItem>
        <NavItem>
          <NavLink to="/dashboard/reports"><FormattedMessage {...messages.reports} /></NavLink>
        </NavItem>
      </Nav>

      <Nav className="float-xs-right" navbar>
        <NavItem>
          <NavLink to="/dashboard/profile"><FormattedMessage {...messages.profile} /> ({userLogin})</NavLink>
        </NavItem>
        <NavItem>
          <NavLink to="/logout"><FormattedMessage {...messages.exit} /></NavLink>
        </NavItem>
      </Nav>
    </Navbar>
  );
};

AppBar.propTypes = {
  userLogin: React.PropTypes.string.isRequired,
};

const userLoginSelector = createSelector(
  state => state.auth.profile.email,
  userLogin => ({ userLogin }),
);

export default injectIntl(connect(userLoginSelector)(AppBar));
