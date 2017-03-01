import React from 'react';
import { defineMessages, injectIntl, FormattedMessage } from 'react-intl';

import ProfileEditForm from '../../components/ProfileEditForm';

const messages = defineMessages({
  profileSettings: {
    id: 'container.profile.profileSettings',
    description: 'Page title',
    defaultMessage: 'Profile settings',
  },
});

const Profile = () => (
  <div>
    <h4><FormattedMessage {...messages.profileSettings} /></h4>
    <hr />
    <ProfileEditForm />
  </div>
);

export default injectIntl(Profile);
