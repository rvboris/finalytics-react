const cp = require('child_process');
const fs = require('fs-extra');

const webpack = 'node_modules/webpack/bin/webpack.js';
const devServer = 'node_modules/webpack-dev-server/bin/webpack-dev-server.js';
const wait = 'node_modules/just-wait/bin/just-wait.js';
const serverConfig = 'webpack/server.babel.js';
const clientConfig = 'webpack/client.babel.js';
const execContext = { env: process.env, stdio: 'inherit' };

if (process.env.NODE_ENV === 'development') {
  fs.removeSync('build');
  fs.mkdirs('build/assets');

  const client = cp.exec(`node ${devServer} --config ${clientConfig}`, execContext);

  client.stdout.pipe(process.stdout);
  client.stderr.pipe(process.stderr);

  cp.execSync(`node ${wait} -p build/webpack-assets.json`);
  cp.execSync(`node ${webpack} --config ${serverConfig}`, execContext);
  cp.fork('build/server.js').send({ cmd: 'start' });

  return;
}

if (process.env.BUILD) {
  fs.removeSync('build');
  fs.mkdirs('build/assets');

  cp.execSync(`node ${webpack} --config ${clientConfig}`, execContext);
  cp.execSync(`node ${webpack} --config ${serverConfig}`);
}

if (!process.env.BUILD) {
  const server = cp.fork('build/server.js');

  server.send({ cmd: 'start' });

  server.on('message', (msg) => {
    if (msg.cmd === 'started' && process.env.E2E) {
      execContext.env.context = msg.ctx;
      execContext.env.startPoint = `http://${msg.ctx.hostname}:${msg.ctx.port}`;

      cp.execSync('ava test/e2e/*.js --tap | faucet', execContext);

      server.send({ cmd: 'stop' });
    }
  });
}
