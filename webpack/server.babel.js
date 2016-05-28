import webpack from 'webpack';
import path from 'path';
import { forEach } from 'lodash';
import precss from 'precss';
import cssnext from 'postcss-cssnext';
import magician from 'postcss-font-magician';
import flexbox from 'postcss-flexbox';
import normalize from 'postcss-normalize';
import stylelint from 'stylelint';
import nodeExternals from 'webpack-node-externals';

import * as configs from '../config';

const webpackAssets = require('../build/webpack-assets.json');

const assets = {
  scripts: [],
  styles: [],
};

forEach(webpackAssets, (chunk) => {
  forEach(chunk, (file, type) => {
    if (type === 'js') {
      assets.scripts.push(file);
    } else if (type === 'css') {
      assets.styles.push(file);
    }
  });
});

const env = process.env.NODE_ENV;
const testing = process.env.TEST;
const e2e = process.env.E2E;
const config = configs[env];

const entry = ['../src/server/index'];

const plugins = [
  new webpack.DefinePlugin({
    __CLIENT__: false,
    __SERVER__: true,
    __DEVELOPMENT__: env === 'development',
    __PRODUCTION__: env === 'production',
    __CONFIG__: JSON.stringify(config),
    __ASSETS__: JSON.stringify(assets),
    __TESTING__: !!testing,
    __E2E__: !!e2e,
    'process.env': {
      NODE_ENV: JSON.stringify(env),
    },
  }),
  new webpack.ProvidePlugin({ Promise: 'bluebird' }),
];

const reactTransforms = [
  {
    transform: 'react-transform-catch-errors',
    imports: ['react', 'redbox-react'],
  },
];

if (env === 'development') {
  entry.unshift('webpack/hot/poll?1000');

  plugins.push(new webpack.HotModuleReplacementPlugin());

  reactTransforms.unshift({
    transform: 'react-transform-hmr',
    imports: ['react'],
    locals: ['module'],
  });
} else {
  plugins.push(new webpack.NoErrorsPlugin());
  plugins.push(new webpack.optimize.DedupePlugin());
}

export default {
  target: 'node',
  cache: env === 'development',
  debug: env === 'development',
  context: __dirname,
  devtool: env === 'development' ? 'source-map' : undefined,
  entry,
  output: {
    path: path.join(__dirname, '../build'),
    filename: 'server.js',
    hotUpdateMainFilename: '/server-hot/[hash].js',
    hotUpdateChunkFilename: '/server-hot/[id]-[hash].js',
    libraryTarget: testing ? 'commonjs' : undefined,
  },
  module: {
    preLoaders: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        loader: 'eslint',
      },
    ],
    loaders: [
      { test: /\.json$/, loader: 'json' },
      { test: /\.(jpg|png)$/, loader: 'url?limit=100000' },
      {
        test: /\.css$/,
        loader: 'isomorphic-style!css?modules&importLoaders=1!postcss',
      },
      {
        test: /\.(ttf|eot|svg|woff(2)?)(\?[a-z0-9]+)?$/,
        loader: 'file-loader?name=assets/fonts/[sha512:hash:base64:7].[ext]',
      },
      { test: /\.pem$/, loader: 'raw-loader' },
      {
        test: /\.js$/,
        exclude: /node_modules/,
        loader: 'babel',
        query: {
          presets: ['stage-0', 'react'],
          plugins: [
            [
              'transform-es2015-modules-commonjs',
              'transform-async-to-module-method',
              'react-transform',
              { transforms: reactTransforms },
            ],
          ],
        },
      },
    ],
  },
  externals: [nodeExternals({
    whitelist: env === 'development' ? ['webpack/hot/poll?1000'] : [],
  })],
  plugins,
  resolve: {
    modulesDirectories: [
      'src',
      'node_modules',
    ],
    extensions: ['', '.json', '.js'],
  },
  node: {
    __dirname: true,
    fs: 'empty',
  },
  eslint: {
    configFile: '.eslintrc',
  },
  postcss: () => [
    stylelint(),
    normalize,
    magician(),
    flexbox(),
    precss,
    cssnext,
  ],
};
