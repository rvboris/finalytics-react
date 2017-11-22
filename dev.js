/* eslint global-require: 0 */

require('babel-polyfill');

process.env.DEBUG = 'dev,webpack';

const path = require('path');
const cp = require('child_process');
const chokidar = require('chokidar');
const webpack = require('webpack');
const Koa = require('koa');
const middleware = require('koa-webpack');
const log = require('debug')('dev');
const config = require('./config/development');
const ProgressPlugin = require('webpack/lib/ProgressPlugin');

class ListenerManager {
  constructor(listener) {
    this.lastConnectionKey = 0;
    this.connectionMap = {};
    this.listener = listener;

    this.listener.on('connection', connection => {
      const connectionKey = ++this.lastConnectionKey;
      this.connectionMap[connectionKey] = connection;

      connection.on('close', () => {
        delete this.connectionMap[connectionKey];
      });
    });
  }

  dispose() {
    return new Promise(resolve => {
      Object.keys(this.connectionMap).forEach((connectionKey) => {
        this.connectionMap[connectionKey].destroy();
      });

      if (this.listener) {
        this.listener.close(resolve);
      } else {
        resolve();
      }
    });
  }
}

class HotServer {
  constructor(compiler) {
    this.compiler = compiler;
    this.instance = null;

    const compiledOutputPath = path.resolve(compiler.options.output.path, `${Object.keys(compiler.options.entry)[0]}.js`);

    try {
      this.instance = cp.fork(compiledOutputPath, {
        env: {
          DEBUG: 'process*,app:*',
        },
        stdio: 'inherit',
      });

      this.instance.once('close', () => {
        this.instance = null;
      });

      const url = `http://${config.hostname}:${config.port}`;

      log(`running on ${url}`);
    } catch (err) {
      log(err);
    }
  }

  dispose() {
    return new Promise((resolve) => {
      if (!this.instance) {
        resolve();
      }

      this.instance.send('shutdown');
      this.instance.once('exit', () => {
        resolve();
        this.instance = null;
      });
    });
  }
}

class HotClient {
  constructor(compiler) {
    const app = new Koa();

    app.use(middleware({
      compiler,
      dev: {
        quiet: true,
        noInfo: true,
      },
    }));

    this.listenerManager = new ListenerManager(app.listen(config.devPort));
  }

  dispose() {
    return Promise.all([
      this.listenerManager ? this.listenerManager.dispose() : undefined,
    ]);
  }
}

class HotServers {
  constructor() {
    this.start = this.start.bind(this);
    this.restart = this.restart.bind(this);
    this._configureHotClient = this._configureHotClient.bind(this);
    this._configureHotServer = this._configureHotServer.bind(this);

    this.clientBundle = null;
    this.clientCompiler = null;
    this.serverBundle = null;
    this.serverCompiler = null;
  }

  start() {
    try {
      const params = {
        mode: 'development',
        debug: 'process*,app:*,-app:db',
      };

      const clientConfig = require('./webpack/client-config')(params);
      const serverConfig = require('./webpack/server-config')(params);
      const clientCompilerCtx =
        new ProgressPlugin(this._progressLogger('client'));
      const serverCompilerCtx =
          new ProgressPlugin(this._progressLogger('server'));

      this.clientCompiler = webpack(clientConfig);
      this.clientCompiler.apply(clientCompilerCtx);

      this.serverCompiler = webpack(serverConfig);
      this.serverCompiler.apply(serverCompilerCtx);
    } catch (err) {
      log(err);
      return;
    }

    this._configureHotClient();
    this._configureHotServer();
  }

  restart() {
    const clearWebpackConfigsCache = () => {
      Object.keys(require.cache).forEach(modulePath => {
        if (modulePath.indexOf('webpack') >= 0) {
          delete require.cache[modulePath];
        }
      });
    };

    Promise.all([
      this.serverBundle ? this.serverBundle.dispose() : undefined,
      this.clientBundle ? this.clientBundle.dispose() : undefined,
    ]).then(clearWebpackConfigsCache).then(this.start, err => log(err));
  }

  _progressLogger(target) {
    return (percentage, msg) => {
      log(`${target} ${(percentage * 100).toFixed()}%`, msg);
    };
  }

  _configureHotClient() {
    this.clientCompiler.plugin('done', (stats) => {
      if (stats.hasErrors()) {
        log(stats.toString({ chunks: false, colors: true }));
      } else {
        log('client build');
      }
    });

    this.clientBundle = new HotClient(this.clientCompiler);
  }

  _configureHotServer() {
    const compileHotServer = () => {
      const runCompiler = () => this.serverCompiler.run(() => undefined);

      if (this.serverBundle) {
        this.serverBundle.dispose().then(runCompiler);
      } else {
        runCompiler();
      }
    };

    this.clientCompiler.plugin('done', (stats) => {
      if (!stats.hasErrors()) {
        compileHotServer();
      }
    });

    this.serverCompiler.plugin('done', (stats) => {
      if (stats.hasErrors()) {
        log(stats.toString({ chunks: false, colors: true }));
        return;
      }

      log('server build');

      this.serverBundle = new HotServer(this.serverCompiler);
    });

    this.watcher = chokidar.watch([path.resolve(__dirname, './src/server')]);

    this.watcher.on('ready', () => {
      this.watcher
        .on('add', compileHotServer)
        .on('addDir', compileHotServer)
        .on('change', compileHotServer)
        .on('unlink', compileHotServer)
        .on('unlinkDir', compileHotServer);
    });
  }
}

const hotServers = new HotServers();
const watcher = chokidar.watch(path.resolve(__dirname, './webpack/config-factory.js'));

watcher.on('ready', () => {
  watcher.on('change', hotServers.restart);
});

hotServers.start();
