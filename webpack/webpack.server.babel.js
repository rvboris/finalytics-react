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
import ProgressBarPlugin from 'progress-bar-webpack-plugin';
import Visualizer from 'webpack-visualizer-plugin';
import LodashModuleReplacementPlugin from 'lodash-webpack-plugin';

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

const env = process.env.NODE_ENV || 'development';
const config = configs[env];

const entry = [
  'source-map-support/register',
  '../src/server/bootstrap',
];

const plugins = [
  new LodashModuleReplacementPlugin(),
  new webpack.dependencies.LabeledModulesPlugin(),
  new Visualizer({ filename: '../webpack/server-stats.html' }),
  new ProgressBarPlugin(),
  new webpack.DefinePlugin({
    __CLIENT__: false,
    __SERVER__: true,
    __DEVELOPMENT__: env === 'development',
    __PRODUCTION__: env === 'production',
    __CONFIG__: JSON.stringify(config),
    __ASSETS__: JSON.stringify(assets),
    'process.env': {
      NODE_ENV: JSON.stringify(env),
    },
  }),
];

if (env === 'production') {
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
    libraryTarget: 'commonjs',
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
          cacheDirectory: true,
          babelrc: false,
          presets: ['react'],
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
  externals: [nodeExternals()],
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
