# Finalytics

[![Greenkeeper badge](https://badges.greenkeeper.io/rvboris/finalytics.svg)](https://greenkeeper.io/)

[![Build Status](https://travis-ci.org/rvboris/finalytics.svg?branch=master)](https://travis-ci.org/rvboris/finalytics) [![GENERAL PUBLIC LICENSE](https://img.shields.io/aur/license/yaourt.svg)](https://github.com/rvboris/finalytics/blob/master/LICENSE.txt)

Simple personal finance service management and analysis, helping to preserve and increase your savings.

***Project under active development***

# Tech details
App is written in ES6/ES7, its universal app uses react and koa

 - Koa 2
 - React/Redux
 - Webpack
 - Mongoose

# Requirements

MongoDB
Node.js 6+

# Setup

 1. Clone repo
 2. Run [yarn](https://yarnpkg.com)
 3. Edit and rename configs under ./config folder
 4. Create key files in ./src/keys/ folder (token-private-development.pem, token-private-production.pem) it used for jwt token creation

# Usage

The project uses webpack build system.

*Development and hot reload*

    npm run dev

*Production build*

 1. `npm run build`
 2. `npm run start`

You will then be able to access it at localhost:3000

# Tests

At first run build for production

    npm run build

Run api tests

    npm run test:api
Run E2E tests

    npm run test:e2e

Run both

    npm run test

# Bug Reports & Feature Requests

Please use the [issue tracker](https://github.com/rvboris/finalytics/issues) to report any bugs or create feature requests.

# License

Finalytics is released as open source software under the GPL v3 license, see the [LICENSE](https://github.com/rvboris/finalytics/blob/master/LICENSE.txt) file in the project root for the full license text.
