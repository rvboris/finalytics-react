import uuid from 'uuid';

import ClientBundleAssets from '../../../build/client/assets.json';

const chunks = Object.keys(ClientBundleAssets).map(key => ClientBundleAssets[key]);

export default chunks.reduce((acc, chunk) => {
  if (chunk.js) {
    acc.javascript.push({ path: chunk.js, key: uuid.v4() });
  }

  if (chunk.css) {
    acc.css.push({ path: chunk.css, key: uuid.v4() });
  }

  return acc;
}, { javascript: [], css: [] });
