import React from 'react';
import { connect } from 'react-redux';
import { createSelector } from 'reselect';
import { Link } from 'react-router';
import { push } from 'react-router-redux';
import {
  Navbar,
  NavbarBrand,
  Nav,
  NavItem,
  NavDropdown,
  DropdownToggle,
  DropdownMenu,
  DropdownItem,
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
  manageAccounts: {
    id: 'component.appBar.manageAccounts',
    description: 'AppBar manage accounts button',
    defaultMessage: 'Manage accounts',
  },
  manageCategories: {
    id: 'component.appBar.manageCategories',
    description: 'AppBar manage categories button',
    defaultMessage: 'Manage categories',
  },
  more: {
    id: 'component.appBar.more',
    description: 'AppBar more button',
    defaultMessage: 'More',
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

class AppBar extends React.Component {
  static propTypes = {
    userLogin: React.PropTypes.string,
    manageAccounts: React.PropTypes.func.isRequired,
    manageCategories: React.PropTypes.func.isRequired,
  };

  constructor(...args) {
    super(...args);

    this.menuToggle = this.menuToggle.bind(this);

    this.state = {
      menuOpen: false,
    };
  }

  menuToggle() {
    this.setState(Object.assign({}, this.state, { menuOpen: !this.state.menuOpen }));
  }

  render() {
    const { userLogin, manageAccounts, manageCategories } = this.props;
    const { menuOpen } = this.state;

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
          <NavDropdown isOpen={menuOpen} toggle={this.menuToggle}>
            <DropdownToggle color="primary" nav caret>
              <FormattedMessage {...messages.more} />
            </DropdownToggle>
            <DropdownMenu>
              <DropdownItem onClick={manageAccounts}>
                <FormattedMessage {...messages.manageAccounts} />
              </DropdownItem>
              <DropdownItem onClick={manageCategories}>
                <FormattedMessage {...messages.manageCategories} />
              </DropdownItem>
            </DropdownMenu>
          </NavDropdown>
        </Nav>

        <Nav className="float-xs-right" navbar>
          <NavItem>
            <NavLink to="/dashboard/profile">
              <FormattedMessage {...messages.profile} /> {userLogin && `(${userLogin})`}
            </NavLink>
          </NavItem>
          <NavItem>
            <NavLink to="/logout"><FormattedMessage {...messages.exit} /></NavLink>
          </NavItem>
        </Nav>
      </Navbar>
    );
  }
}

const mapDispatchToProps = (dispatch) => ({
  manageAccounts: () => dispatch(push('/dashboard/accounts')),
  manageCategories: () => dispatch(push('/dashboard/categories')),
});

const userLoginSelector = createSelector(
  state => state.auth.profile.email,
  userLogin => ({ userLogin }),
);

export default injectIntl(connect(userLoginSelector, mapDispatchToProps)(AppBar));
