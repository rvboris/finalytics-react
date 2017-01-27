const _ = require('lodash');
const path = require('path');
const webpack = require('webpack');
const AssetsPlugin = require('assets-webpack-plugin');
const nodeExternals = require('webpack-node-externals');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const log = require('debug')('webpack');
const Visualizer = require('webpack-visualizer-plugin');
const LodashModuleReplacementPlugin = require('lodash-webpack-plugin');
const Writable = require('stream').Writable;
const configs = require('../config');

const ifElse = (condition) => (then, or) => (condition ? then : or);

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
  const ifClient = ifElse(isClient);
  const ifServer = ifElse(isServer);
  const ifDevClient = ifElse(isDev && isClient);
  const ifProdClient = ifElse(isProd && isClient);

  const config = configs[options.mode];
  const configForClient = _.omit(config, [
    'sessionKeys',
    'db',
    'google',
    'facebook',
    'twitter',
    'openexchangerates',
    'tokenKeyFile',
  ]);

  const reloadPath = `http://${config.hostname}:${config.devPort}/__webpack_hmr`;

  return {
    target: ifServer('node', 'web'),
    node: {
      __dirname: true,
      __filename: true,
    },
    externals: _.compact([ifServer(nodeExternals())]),
    devtool: ifElse(isServer || isDev)(
      'source-map',
      'hidden-source-map'
    ),
    entry: _.merge(
      {
        main: _.compact([
          ifDevClient('react-hot-loader/patch'),
          ifDevClient(`webpack-hot-middleware/client?reload=true&path=${reloadPath}`),

          ifClient('webfontloader'),
          ifClient('react-toggle/style.css'),
          ifClient('react-select/dist/react-select.css'),
          ifClient('react-virtualized-select/styles.css'),
          ifClient('react-day-picker/lib/style.css'),

          ifServer(
            path.resolve(__dirname, `../src/${target}/bootstrap.js`),
            path.resolve(__dirname, `../src/${target}/app.js`)
          ),
        ]),
      }
    ),
    output: {
      path: path.resolve(__dirname, `../build/${target}`),
      filename: ifProdClient(
        '[name]-[hash].js',
        '[name].js'
      ),
      publicPath: ifDev(
        `http://${config.hostname}:${config.devPort}/assets/`,
        '/assets/'
      ),
      chunkFilename: '[name]-[chunkhash].js',
      libraryTarget: ifServer('commonjs2', 'var'),
    },
    resolve: {
      extensions: ['.js', '.json'],
      alias: {
        'react/lib/ReactDOM': 'react-dom', // redbox-react fix
      },
    },
    plugins: _.compact([
      new webpack.LoaderOptionsPlugin({
        options: {
          eslint: {
            configFile: '.eslintrc',
          },
          context: __dirname,
          output: { path: './' },
        },
      }),
      new webpack.ContextReplacementPlugin(/moment[\\/]locale$/, /^\.\/(en|ru)$/),
      new webpack.DefinePlugin({
        CONFIG: JSON.stringify(ifServer(config, configForClient)),
        IS_CLIENT: isClient,
        IS_SERVER: isServer,
        'process.env': {
          NODE_ENV: JSON.stringify(options.mode),
          SERVER_PORT: JSON.stringify(config.port),
          DEBUG: JSON.stringify(options.debug || ''),
          CI: JSON.stringify(process.env.CI || ''),
        },
      }),
      ifClient(new LodashModuleReplacementPlugin({
        collections: true,
        paths: true,
      })),
      ifClient(new AssetsPlugin({
        filename: 'assets.json',
        path: path.resolve(__dirname, `../build/${target}`),
      })),
      ifClient(new Visualizer({ filename: '../client-stats.html' })),
      ifServer(new Visualizer({ filename: '../server-stats.html' })),
      ifDev(new webpack.NoEmitOnErrorsPlugin()),
      ifDevClient(new webpack.HotModuleReplacementPlugin()),
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
      ifClient(
        new ExtractTextPlugin({
          filename: '[name]-[chunkhash].css',
          disable: false,
          allChunks: true,
        })
      ),
    ]),
    stats: 'minimal',
    module: {
      rules: _.compact([
        {
          enforce: 'pre',
          test: /\.js$/,
          exclude: [/node_modules/, path.resolve(__dirname, '../build')],
          loader: 'eslint-loader',
        },
        {
          test: /\.(jpg|png|svg)$/,
          exclude: [/node_modules/, path.resolve(__dirname, '../build')],
          loader: 'url-loader?limit=100000',
        },
        {
          test: /\.woff(2)?(\?v=[0-9]\.[0-9]\.[0-9])?$/,
          loader: 'url-loader?limit=10000&mimetype=application/font-woff',
        },
        {
          test: /\.(ttf|eot|svg)(\?v=[0-9]\.[0-9]\.[0-9])?$/,
          loader: 'file-loader',
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
              cacheDirectory: false,
              babelrc: false,

              plugins: [
                'transform-promise-to-bluebird',
                'transform-runtime',
                'lodash',
              ],
            },
            ifServer({ presets: ['react', ['latest', { es2015: false, es2016: false }], 'stage-1'] }),
            ifClient({ presets: ['react', 'latest', 'stage-1'] }),
            ifDev({
              env: {
                development: {
                  plugins: ['react-hot-loader/babel'],
                },
              },
            })
          ),
        },
        _.merge(
          { test: /.scss$/ },
          ifProdClient({
            loader: ExtractTextPlugin.extract({
              fallbackLoader: 'style-loader',
              loader: 'css-loader!postcss-loader!sass-loader',
            }),
          }),
          ifDevClient({ loaders: ['style-loader', 'css-loader', 'sass-loader'] })
        ),
        _.merge(
          { test: /node_modules.+\.css$/ },
          ifServer({ loader: 'css-loader/locals' }),
          ifProdClient({
            loader: ExtractTextPlugin.extract({
              fallbackLoader: 'style-loader',
              loader: 'css-loader',
            }),
          }),
          ifDevClient({ loaders: ['style-loader', 'css-loader'] })
        ),
        _.merge(
          { test: /(shared|client).+\.css$/ },
          ifServer({ loaders: ['css-loader/locals?modules', 'postcss-loader'] }),
          ifProdClient({
            loader: ExtractTextPlugin.extract({
              fallbackLoader: 'style-loader',
              loader: 'css-loader?modules!postcss-loader',
            }),
          }),
          ifDevClient({
            loaders: [
              'style-loader',
              'css-loader?modules',
              'postcss-loader',
            ],
          })
        ),
      ]),
    },
  };
};
