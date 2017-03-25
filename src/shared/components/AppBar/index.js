import React from 'react';
import { connect } from 'react-redux';
import { createSelector } from 'reselect';
import { NavLink } from 'react-router-dom';
import { get } from 'lodash';
import { push } from 'react-router-redux';
import {
  Navbar,
  NavbarBrand,
  NavbarToggler,
  Nav,
  Collapse,
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

const StyledLink = (props) => (
  <NavLink {...props} className="nav-link" activeClassName="active">
    {props.children}
  </NavLink>
);

StyledLink.propTypes = {
  children: React.PropTypes.any,
};

StyledLink.defaultProps = {
  children: null,
};

class AppBar extends React.Component {
  static propTypes = {
    userLogin: React.PropTypes.string,
    manageAccounts: React.PropTypes.func.isRequired,
    manageCategories: React.PropTypes.func.isRequired,
  };

  static defaultProps = {
    userLogin: '',
  };

  constructor(...args) {
    super(...args);

    this.state = {
      menuOpen: false,
      navOpen: false,
    };
  }

  menuToggle = () => {
    this.setState(Object.assign({}, this.state, { menuOpen: !this.state.menuOpen }));
  }

  toggleNavbar = () => {
    this.setState(Object.assign({}, this.state, { navOpen: !this.state.navOpen }));
  }

  render() {
    const { userLogin, manageAccounts, manageCategories } = this.props;
    const { menuOpen, navOpen } = this.state;

    return (
      <Navbar color="primary" inverse toggleable>
        <NavbarToggler onClick={this.toggleNavbar} />
        <NavbarBrand href="/dashboard/operations">Finalytics</NavbarBrand>

        <Collapse isOpen={navOpen} navbar>
          <Nav navbar>
            <NavItem>
              <StyledLink to="/dashboard/operations"><FormattedMessage {...messages.operations} /></StyledLink>
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
          <Nav className="ml-auto" navbar>
            <NavItem>
              <StyledLink to="/dashboard/profile">
                <FormattedMessage {...messages.profile} /> {userLogin && `(${userLogin})`}
              </StyledLink>
            </NavItem>
            <NavItem>
              <StyledLink to="/logout"><FormattedMessage {...messages.exit} /></StyledLink>
            </NavItem>
          </Nav>
        </Collapse>
      </Navbar>
    );
  }
}

const mapDispatchToProps = (dispatch) => ({
  manageAccounts: () => dispatch(push('/dashboard/accounts')),
  manageCategories: () => dispatch(push('/dashboard/categories')),
});

const userLoginSelector = createSelector(
  state => get(state, 'auth.profile.email'),
  userLogin => ({ userLogin }),
);

export default injectIntl(connect(userLoginSelector, mapDispatchToProps)(AppBar));
