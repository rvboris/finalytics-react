import logger from 'debug';

export const createLogger = (wildcard = '') => {
  if (wildcard) {
    wildcard = `:${wildcard}`;
  }

  return {
    info: logger(`app:info${wildcard}`),
    error: logger(`app:error${wildcard}`),
    debug: logger(`app:debug${wildcard}`),
    request: logger(`app:request${wildcard}`),
  };
};

const defaultLogger = createLogger();

export default defaultLogger.info;

export const info = defaultLogger.info;
export const error = defaultLogger.error;
export const debug = defaultLogger.debug;
export const request = defaultLogger.request;
