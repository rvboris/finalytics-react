import fs from 'fs';
import path from 'path';

import config from '../../shared/config';

export default process.env.CI
  ? 'ci-token-key'
  : fs.readFileSync(path.join(__dirname, config.tokenKeyFile));
