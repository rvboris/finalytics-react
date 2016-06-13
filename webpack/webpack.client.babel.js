import webpack from 'webpack';
import path from 'path';
import { mapValues, merge, omit } from 'lodash';
import precss from 'precss';
import cssnext from 'postcss-cssnext';
import ExtractTextPlugin from 'extract-text-webpack-plugin';
import AssetsPlugin from 'assets-webpack-plugin';
import flexbox from 'postcss-flexbox';
import magician from 'postcss-font-magician';
import normalize from 'postcss-normalize';
import stylelint from 'stylelint';
import ProgressBarPlugin from 'progress-bar-webpack-plugin';
import Visualizer from 'webpack-visualizer-plugin';
import LodashModuleReplacementPlugin from 'lodash-webpack-plugin';

import * as configs from '../config';

const pkg = require('../package.json');

const externals = mapValues(merge(pkg.dependencies || [], pkg.devDependencies || []),
  (dep, key) => `commonjs ${key}`);

const env = process.env.NODE_ENV || 'development';
const config = configs[env];

const entry = {};

entry.common = [
  ...Object.keys(externals)
    .filter(depName => depName.startsWith('react') || depName.startsWith('redux')),
  'reselect',
  'seamless-immutable',
  'axios',
  'history',
  'moment',
  'money',
];

entry.app = [
  '../src/client/app.js',
  '../src/server/components/ServerLayout.css',
];

const configForClient = omit(config, [
  'sessionKeys',
  'db',
  'google',
  'facebook',
  'twitter',
  'openexchangerates',
]);

const plugins = [
  new LodashModuleReplacementPlugin(),
  new ProgressBarPlugin(),
  new webpack.DefinePlugin({
    __CLIENT__: true,
    __SERVER__: false,
    __DEVELOPMENT__: env === 'development',
    __PRODUCTION__: env === 'production',
    __CONFIG__: JSON.stringify(configForClient),
    'process.env': {
      NODE_ENV: JSON.stringify(env),
    },
  }),
  new webpack.optimize.CommonsChunkPlugin({ name: 'common' }),
  new webpack.ContextReplacementPlugin(/moment[\\\/]locale$/, /^\.\/(en|ru)$/),
  new ExtractTextPlugin('styles.css'),
  new AssetsPlugin({
    path: 'build',
    prettyPrint: false,
  }),
];

if (env === 'production') {
  entry.common = entry.common.filter(item => item.indexOf('devtools') < 0);

  plugins.push(new webpack.optimize.OccurrenceOrderPlugin());
  plugins.push(new webpack.optimize.DedupePlugin());
  plugins.push(new webpack.optimize.UglifyJsPlugin({
    compress: {
      warnings: false,
      screw_ie8: true,
      sequences: true,
      dead_code: true,
      drop_debugger: true,
      comparisons: true,
      conditionals: true,
      evaluate: true,
      booleans: true,
      loops: true,
      unused: true,
      hoist_funs: true,
      if_return: true,
      join_vars: true,
      cascade: true,
      drop_console: true,
    },
    output: {
      comments: false,
    },
  }));

  plugins.push(new Visualizer({ filename: '../../webpack/client-stats.html' }));
  plugins.push(new webpack.NoErrorsPlugin());
}

let publicPath;

if (env === 'development') {
  publicPath = `http://${config.hostname}:${config.hotPort}/assets/`;
} else {
  publicPath = '/assets/';
}

export default {
  devServer: {
    publicPath,
    hot: false,
    inline: true,
    quiet: false,
    noInfo: true,
    headers: { 'Access-Control-Allow-Origin': '*' },
    stats: { colors: true },
    host: config.hostname,
    port: config.hotPort,
  },
  target: 'web',
  cache: env === 'development',
  debug: env === 'development',
  context: __dirname,
  devtool: env === 'development' ? 'source-map' : null,
  entry,
  output: {
    path: path.join(__dirname, '../build/assets'),
    filename: '[name]-[hash].js',
    chunkFilename: '[name]-[hash].js',
    hotUpdateMainFilename: '/client-hot/[hash].js',
    hotUpdateChunkFilename: '/client-hot/[id]-[hash].js',
    publicPath,
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
        loader: ExtractTextPlugin.extract('isomorphic-style-loader',
          'css?modules&importLoaders=1!postcss'),
      },
      {
        test: /\.(ttf|eot|svg|woff(2)?)(\?[a-z0-9]+)?$/,
        loader: 'file-loader?name=fonts/[sha512:hash:base64:7].[ext]',
      },
      {
        test: /\.js$/,
        exclude: /node_modules/,
        loader: 'babel',
        query: {
          cacheDirectory: true,
          babelrc: false,
          presets: ['es2015', 'react'],
          plugins: [
            'lodash',
            'transform-async-to-generator',
            'transform-strict-mode',
            'transform-do-expressions',
            'transform-exponentiation-operator',
            'syntax-trailing-function-commas',
            'transform-object-rest-spread',
            'transform-class-properties',
            'transform-export-extensions',
            'transform-es2015-modules-commonjs',
            [
              'transform-runtime',
              {
                polyfill: true,
                regenerator: true,
              },
            ],
            [
              'react-transform',
              {
                transforms: [
                  {
                    transform: 'react-transform-catch-errors',
                    imports: ['react', 'redbox-react'],
                  },
                ],
              },
            ],
          ],
        },
      },
    ],
  },
  plugins,
  resolve: {
    modulesDirectories: [
      'src',
      'node_modules',
    ],
    extensions: ['', '.json', '.js'],
    alias: {
      react: env === 'production' ? 'react-lite' : 'react',
      'react-dom': env === 'production' ? 'react-lite' : 'react',
    },
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
