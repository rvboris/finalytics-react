import webpack from 'webpack';
import path from 'path';
import { mapValues, merge, forEach } from 'lodash';
import precss from 'precss';
import cssnext from 'postcss-cssnext';
import magician from 'postcss-font-magician';
import flexbox from 'postcss-flexbox';
import atImport from 'postcss-import';
import stylelint from 'stylelint';

import * as configs from '../config';

const pkg = require('../package.json');

let webpackAssets = {};

try {
  webpackAssets = require('../build/webpack-assets.json');
} catch (e) {
  console.error(e);
}

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

const externals = mapValues(merge(pkg.dependencies || [], pkg.devDependencies || []),
  (dep, key) => `commonjs ${key}`);

const env = process.env.NODE_ENV;
const config = configs[env];

const entry = ['../src/server/app'];

const plugins = [
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
      {
        test: /\.js$/,
        exclude: /node_modules/,
        loader: 'babel',
        query: {
          presets: ['es2015-node5', 'stage-3', 'react'],
          plugins: [
            [
              'transform-class-properties',
              'transform-es2015-classes',
              'react-transform',
              { transforms: reactTransforms },
            ],
          ],
        },
      },
    ],
  },
  externals,
  plugins,
  resolve: {
    modulesDirectories: [
      'src',
      'node_modules',
    ],
    extensions: ['', '.json', '.js'],
    packageMains: ['style'],
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
    atImport({ addDependencyTo: webpack }),
    magician(),
    flexbox(),
    precss,
    cssnext,
  ],
};
