import { createAction } from 'redux-actions';

import config from '../config';

const USER_API = `${config.apiUrl}/user`;
const AUTH_API = `${config.apiUrl}/auth`;

export const login = createAction('AUTH_LOGIN',
  null,
  (values) => ({
    request: {
      url: `${AUTH_API}/login`,
      method: 'post',
      values,
    },
  })
);

export const logout = createAction('AUTH_LOGOUT',
  null,
  () => ({
    request: {
      url: `${AUTH_API}/logout`,
      method: 'post',
    },
  })
);

export const register = createAction('AUTH_REGISTER',
  null,
  (values) => ({
    request: {
      url: `${AUTH_API}/register`,
      method: 'post',
      values,
    },
  })
);

export const getProfile = createAction('AUTH_GET_PROFILE',
  null,
  () => ({
    request: {
      url: `${USER_API}/profile`,
      method: 'get',
    },
  })
);

export const getProfileResolved = createAction('AUTH_GET_PROFILE_RESOLVED',
  (profile) => ({ data: profile })
);

export const setSettings = createAction('AUTH_SET_SETTINGS',
  null,
  (values) => ({
    request: {
      url: `${USER_API}/settings`,
      method: 'post',
      values,
    },
  })
);

export const setSettingsResolved = createAction('AUTH_SET_SETTINGS_RESOLVED',
  (settings) => ({ data: settings })
);

export const setToken = createAction('AUTH_SET_TOKEN',
  (token) => ({ token })
);

export const setUserAgent = createAction('AUTH_SET_USER_AGENT',
  (userAgent) => ({ userAgent })
);

export const setStatus = createAction('AUTH_SET_STATUS',
  null,
  (status) => ({
    request: {
      url: `${USER_API}/status`,
      method: 'post',
      values: { status },
    },
  })
);

export default {
  login,
  logout,
  register,
  getProfile,
  getProfileResolved,
  setSettings,
  setSettingsResolved,
  setToken,
  setUserAgent,
  setStatus,
};
