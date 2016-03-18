const sh = require('shelljs');

const webpack = 'node_modules/webpack/bin/webpack.js';
const devServer = 'node_modules/webpack-dev-server/bin/webpack-dev-server.js';
const wait = 'node_modules/just-wait/bin/just-wait.js';
const serverConfig = 'webpack/server.babel.js';
const clientConfig = 'webpack/client.babel.js';
const execContext = { env: sh.env };

sh.rm('-rf', 'build');
sh.mkdir('-p', 'build/assets');

if (sh.env.NODE_ENV === 'development') {
  sh.exec(`node ${devServer} --config ${clientConfig}`,
    Object.assign({}, execContext, { async: true }));

  sh.exec(`node ${wait} -p build/webpack-assets.json`, () => {
    sh.exec(`node ${webpack} --watch --progress --color --config ${serverConfig}`,
      Object.assign({}, execContext, { async: true }));

    sh.exec(`node ${wait} -p build/server.js`, () => {
      sh.exec('node build/server.js', Object.assign({}, execContext, { async: true }));
    });
  });
} else {
  sh.exec(`node ${webpack} --progress --color --config ${clientConfig}`,
    Object.assign({}, execContext, { async: true }));

  sh.exec(`node ${wait} -t 120 -p build/webpack-assets.json`, () => {
    sh.exec(`node ${webpack} --progress --color --config ${serverConfig}`,
      Object.assign({}, execContext, { async: true }));

    sh.exec(`node ${wait} -t 120 -p build/server.js`,
      () => { sh.exec('node build/server.js', execContext); }
    );
  });
}
