import fs from 'fs';

import config from '../../shared/config';

export default process.env.CI
  ? 'ci-token-key'
  : fs.readFileSync(config.tokenKeyFile);
