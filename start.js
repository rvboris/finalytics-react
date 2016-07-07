const cp = require('child_process');
const fs = require('fs-extra');
const debug = require('debug')('process');

const webpack = 'node_modules/webpack/bin/webpack.js';
const devServer = 'node_modules/webpack-dev-server/bin/webpack-dev-server.js';
const wait = 'node_modules/just-wait/bin/just-wait.js';
const serverConfig = 'webpack/webpack.server.babel.js';
const clientConfig = 'webpack/webpack.client.babel.js';
const execContext = { env: process.env, stdio: 'inherit' };

if (process.env.NODE_ENV === 'development') {
  fs.removeSync('build');
  fs.mkdirs('build/assets');

  debug('---------------starting client dev server---------------');
  const client = cp.exec(`node ${devServer} --config ${clientConfig}`, execContext);

  client.stdout.pipe(process.stdout);
  client.stderr.pipe(process.stderr);

  cp.execSync(`node ${wait} -p build/webpack-assets.json -t 60`, execContext);

  debug('---------------server build start---------------');
  cp.execSync(`node ${webpack} --config ${serverConfig}`, execContext);
  debug('---------------server build end---------------');

  debug('---------------starting server---------------');
  cp.fork('build/server.js');

  return;
}

if (process.env.BUILD) {
  if (process.env.CLIENT) {
    fs.removeSync('build/assets');
    fs.removeSync('build/webpack-assets.json');
    fs.mkdirs('build/assets');

    debug('---------------client build start---------------');
    cp.execSync(`node ${webpack} --config ${clientConfig}`, execContext);
    debug('---------------client build end---------------');
  }

  if (process.env.SERVER) {
    fs.removeSync('build/server.js');

    debug('---------------server build start---------------');
    cp.execSync(`node ${webpack} --config ${serverConfig}`, execContext);
    debug('---------------server build end---------------');
  }
}

if (!process.env.BUILD) {
  debug('---------------starting server---------------');
  const server = cp.fork('build/server.js');

  server.on('message', (msg) => {
    if (msg.cmd === 'started' && process.env.E2E) {
      execContext.env.context = msg.ctx;
      execContext.env.startPoint = `http://${msg.ctx.hostname}:${msg.ctx.port}`;

      debug('---------------e2e tests start---------------');
      cp.execSync('ava test/e2e/*.js --tap | tap-summary', execContext);
      debug('---------------e2e tests end---------------');

      server.send('shutdown');
    }
  });

  server.on('exit', () => {
    debug('---------------stop server---------------');
    process.exit(0);
  });
}
