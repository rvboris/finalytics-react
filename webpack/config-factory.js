const _ = require('lodash');
const path = require('path');
const webpack = require('webpack');
const AssetsPlugin = require('assets-webpack-plugin');
const nodeExternals = require('webpack-node-externals');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const log = require('debug')('webpack');
const cssnext = require('postcss-cssnext');
const flexbox = require('postcss-flexbox');
const Visualizer = require('webpack-visualizer-plugin');
const LodashModuleReplacementPlugin = require('lodash-webpack-plugin');
const ProgressBarPlugin = require('progress-bar-webpack-plugin');
const Writable = require('stream').Writable;
const configs = require('../config');
const pkg = require('../package.json');

const ifElse = (condition) => (then, or) => (condition ? then : or);

const externals = _.mapValues(_.merge(pkg.dependencies || [], pkg.devDependencies || []),
  (dep, key) => `commonjs ${key}`);

const logStream = Writable({
  write(chunk, encoding, next) {
    log(chunk.toString('utf8', chunk.length, chunk.length - 1));
    next();
  },
});

logStream.isTTY = process.stdout.isTTY;

module.exports = ({ target, options }) => {
  log(`Creating webpack "${target}" config in "${options.mode}" mode`);

  const isDev = options.mode === 'development';
  const isProd = options.mode === 'production';
  const isClient = target === 'client';
  const isServer = target === 'server';

  const ifDev = ifElse(isDev);
  const ifProd = ifElse(isProd);
  const ifClient = ifElse(isClient);
  const ifServer = ifElse(isServer);
  const ifDevClient = ifElse(isDev && isClient);
  const ifDevServer = ifElse(isDev && isServer);
  const ifProdClient = ifElse(isProd && isClient);

  const config = configs[options.mode];
  const configForClient = _.omit(config, [
    'sessionKeys',
    'db',
    'google',
    'facebook',
    'twitter',
    'openexchangerates',
  ]);

  const fontPath = ifServer('../client', '');
  const reloadPath = `http://localhost:${config.devPort}/__webpack_hmr`;

  return {
    target: ifServer('node', 'web'),
    node: {
      __dirname: true,
      __filename: true,
    },
    externals: _.compact([
      ifServer(nodeExternals()),
    ]),
    devtool: ifElse(isServer || isDev)(
      'source-map',
      'hidden-source-map'
    ),
    entry: _.merge(
      {
        main: _.compact([
          ifDevClient('react-hot-loader/patch'),
          ifDevClient(`webpack-hot-middleware/client?reload=true&path=${reloadPath}`),
          ifServer(
            path.resolve(__dirname, `../src/${target}/index.js`),
            path.resolve(__dirname, `../src/${target}/app.js`)
          ),
        ]),
      },
      ifClient({
        vendor: [
          ...Object.keys(externals)
            .filter(depName => depName.startsWith('react') || depName.startsWith('redux')),
          'bootstrap-css',
          'reselect',
          'seamless-immutable',
          'axios',
          'history',
          'moment',
          'money',
        ],
      })
    ),
    output: {
      path: path.resolve(__dirname, `../build/${target}`),
      filename: ifProdClient(
        '[name]-[hash].js',
        '[name].js'
      ),
      publicPath: ifDev(
        `http://localhost:${config.devPort}/assets/`,
        '/assets/'
      ),
      chunkFilename: '[name]-[chunkhash].js',
      libraryTarget: ifServer('commonjs2', 'var'),
    },
    resolve: {
      extensions: ['.js', '.json'],
      alias: {
        react: ifElse(isDev)('react', 'react-lite'),
        'react-dom': ifElse(isDev)('react-dom', 'react-lite'),
      },
    },
    eslint: {
      configFile: '.eslintrc',
    },
    postcss: () => [
      flexbox(),
      cssnext,
    ],
    plugins: _.compact([
      ifDevClient(new webpack.dependencies.LabeledModulesPlugin()),
      ifServer(new webpack.dependencies.LabeledModulesPlugin()),
      new ProgressBarPlugin({ stream: logStream }),
      new LodashModuleReplacementPlugin(),
      new webpack.ContextReplacementPlugin(/moment[\\\/]locale$/, /^\.\/(en|ru)$/),
      new webpack.DefinePlugin({
        CONFIG: JSON.stringify(ifServer(config, configForClient)),
        IS_CLIENT: isClient,
        IS_SERVER: isServer,
        'process.env': {
          NODE_ENV: JSON.stringify(options.mode),
          SERVER_PORT: JSON.stringify(config.port),
          DEBUG: JSON.stringify(options.debug || ''),
        },
      }),
      ifClient(new AssetsPlugin({
        filename: 'assets.json',
        path: path.resolve(__dirname, `../build/${target}`),
      })),
      ifClient(new webpack.optimize.CommonsChunkPlugin({
        name: 'vendor',
        children: true,
        minChunks: 2,
      })),
      ifClient(new Visualizer({ filename: '../client-stats.html' })),
      ifServer(new Visualizer({ filename: '../server-stats.html' })),
      ifDev(new webpack.NoErrorsPlugin()),
      ifDevClient(new webpack.HotModuleReplacementPlugin()),
      ifDevServer(new webpack.optimize.LimitChunkCountPlugin({ maxChunks: 1 })),
      ifProdClient(
        new webpack.LoaderOptionsPlugin({
          minimize: true,
          debug: false,
        })
      ),
      ifProdClient(
        new webpack.optimize.UglifyJsPlugin({
          compress: {
            screw_ie8: true,
            warnings: false,
          },
        })
      ),
      ifProd(new webpack.optimize.DedupePlugin()),
      ifProdClient(
        new ExtractTextPlugin('[name]-[chunkhash].css', { allChunks: true })
      ),
    ]),
    module: {
      preLoaders: [
        {
          test: /\.js$/,
          exclude: [/node_modules/, path.resolve(__dirname, '../build')],
          loader: 'eslint',
        },
        {
          test: /\.css$/,
          exclude: [/node_modules/, path.resolve(__dirname, '../build')],
          loader: 'stylelint',
        },
      ],
      loaders: _.compact([
        {
          test: /\.pem$/,
          exclude: [/node_modules/, path.resolve(__dirname, '../build')],
          loader: 'raw-loader',
        },
        {
          test: /\.(jpg|png)$/,
          exclude: [/node_modules/, path.resolve(__dirname, '../build')],
          loader: 'url?limit=100000',
        },
        {
          test: /\.(ttf|eot|svg|woff(2)?)(\?[a-z0-9]+)?$/,
          exclude: [/node_modules/, path.resolve(__dirname, '../build')],
          loader: `file-loader?name=${fontPath}/[sha512:hash:base64:7].[ext]`,
        },
        {
          test: /\.json$/,
          exclude: /node_modules/,
          loader: 'json-loader',
        },
        {
          test: /\.js$/,
          loader: 'babel-loader',
          exclude: [/node_modules/, path.resolve(__dirname, '../build')],
          query: _.merge(
            {
              cacheDirectory: true,
              babelrc: false,
              env: {
                development: {
                  plugins: ['react-hot-loader/babel'],
                },
              },
              plugins: [
                'transform-class-properties',
                'lodash',
                [
                  'transform-runtime',
                  {
                    polyfill: true,
                    regenerator: true,
                  },
                ],
              ],
            },
            ifServer({ presets: ['react', 'stage-1'] }),
            ifClient({
              presets: [
                'react',
                'stage-1',
                'es2015-webpack',
              ],
            })
          ),
        },
        _.merge(
          { test: /\.css$/ },
          ifServer({ loader: ['fake-style', 'css-loader?modules', 'postcss-loader'] }),
          ifDevClient({ loader: ['style-loader', 'css-loader?modules', 'postcss-loader'] }),
          ifProdClient({
            loader:
              ExtractTextPlugin.extract('style-loader', 'css-loader?modules', 'postcss-loader'),
          })
        ),
      ]),
    },
  };
};
