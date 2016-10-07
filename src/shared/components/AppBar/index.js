import React from 'react';
import { Link } from 'react-router';
import { LinkContainer, IndexLinkContainer } from 'react-router-bootstrap';
import { Navbar, Nav, NavItem } from 'react-bootstrap';
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
  settings: {
    id: 'component.appBar.settings',
    description: 'AppBar settings link',
    defaultMessage: 'Settings',
  },
  exit: {
    id: 'component.appBar.exit',
    description: 'AppBar exit link',
    defaultMessage: 'Logout',
  },
});

const AppBar = () => (
  <Navbar staticTop>
    <Navbar.Header>
      <Navbar.Brand>
        <Link to="/dashboard/operations">Finalytics</Link>
      </Navbar.Brand>
      <Navbar.Toggle />
    </Navbar.Header>
    <Navbar.Collapse>
      <Nav>
        <IndexLinkContainer to="/dashboard/operations">
          <NavItem eventKey={1}><FormattedMessage {...messages.operations} /></NavItem>
        </IndexLinkContainer>
        <LinkContainer to="/dashboard/budget">
          <NavItem eventKey={2}><FormattedMessage {...messages.budget} /></NavItem>
        </LinkContainer>
        <LinkContainer to="/dashboard/reports">
          <NavItem eventKey={3}><FormattedMessage {...messages.reports} /></NavItem>
        </LinkContainer>
      </Nav>
      <Nav pullRight>
        <LinkContainer to="/settings">
          <NavItem eventKey={4}><FormattedMessage {...messages.settings} /></NavItem>
        </LinkContainer>
        <LinkContainer to="/logout">
          <NavItem eventKey={5}><FormattedMessage {...messages.exit} /></NavItem>
        </LinkContainer>
      </Nav>
    </Navbar.Collapse>
  </Navbar>
);

export default injectIntl(AppBar);
