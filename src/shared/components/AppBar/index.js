import React from 'react';
import {
  Navbar,
  NavbarBrand,
  Nav,
  NavItem,
  NavLink,
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


class AppBar extends React.Component {
  constructor(props) {
    super(props);

    this.toggle = this.toggle.bind(this);

    this.state = {
      dropdownOpen: false,
    };
  }

  toggle() {
    this.setState({
      dropdownOpen: !this.state.dropdownOpen,
    });
  }

  render() {
    return (
      <Navbar color="primary" dark>
        <NavbarBrand href="/dashboard/operations">Finalytics</NavbarBrand>
        <Nav navbar>
          <NavItem>
            <NavLink href="/dashboard/operations"><FormattedMessage {...messages.operations} /></NavLink>
          </NavItem>
          <NavItem>
            <NavLink href="/dashboard/budget"><FormattedMessage {...messages.budget} /></NavLink>
          </NavItem>
          <NavItem>
            <NavLink href="/dashboard/reports"><FormattedMessage {...messages.reports} /></NavLink>
          </NavItem>
        </Nav>

        <Nav className="float-xs-right" navbar>
          <NavItem>
            <NavLink href="/dashboard/profile"><FormattedMessage {...messages.profile} /></NavLink>
          </NavItem>
          <NavItem>
            <NavLink href="/logout"><FormattedMessage {...messages.exit} /></NavLink>
          </NavItem>
        </Nav>
      </Navbar>
    );
  }
}

export default injectIntl(AppBar);
