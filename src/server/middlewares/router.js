import Router from 'koa-66';
import { each } from 'lodash';
import * as routes from '../api';
import * as plugins from '../plugins';

const router = new Router();

each(plugins, (plugin, pluginName) => {
  router.plugin(pluginName, plugin);
});

each(routes, (route, routeName) => {
  router.mount(`/api/${routeName}`, route);
});

export default router.routes({ throw: true });
