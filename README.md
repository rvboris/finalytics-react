# Finalytics

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

# License

Finalytics is released as open source software under the GPL v3 license, see the LICENSE file in the project root for the full license text.
