import App from './containers/App';
import Home from './containers/Home';
import Login from './containers/Login';
import Register from './containers/Register';
import Logout from './containers/Logout';
import Dashboard from './containers/Dashboard';
import Operations from './containers/Operations';
import Accounts from './containers/Accounts';
import Categories from './containers/Categories';
import Profile from './containers/Profile';
import NotFound from './containers/NotFound';

export default [
  {
    component: App,
    routes: [
      {
        path: '/',
        exact: true,
        component: Home,
      },
      {
        path: '/login',
        exact: true,
        component: Login,
        auth: {
          required: false,
          redirect: '/dashboard',
          status: 307,
        },
      },
      {
        path: '/register',
        exact: true,
        component: Register,
        auth: {
          required: false,
          redirect: '/dashboard',
          status: 307,
        },
      },
      {
        path: '/logout',
        exact: true,
        component: Logout,
        auth: {
          required: true,
          redirect: '/login',
        },
      },
      {
        path: '/dashboard',
        component: Dashboard,
        auth: {
          required: true,
          redirect: '/login',
          status: 307,
        },
        routes: [
          {
            path: '/dashboard/accounts/:accountId?',
            component: Accounts,
          },
          {
            path: '/dashboard/categories/:categoryId?',
            component: Categories,
          },
          {
            path: '/dashboard/profile',
            exact: true,
            component: Profile,
          },
          {
            path: '/dashboard/operations',
            exact: true,
            component: Operations,
          },
          {
            path: '/dashboard',
            exact: true,
            component: Operations,
          },
        ],
      },
      {
        component: NotFound,
      },
    ],
  },
];
