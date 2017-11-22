import logger from 'debug';

export const createLogger = (wildcard = '') => {
  const namespace = wildcard ? `:${wildcard}` : '';

  return {
    info: logger(`app:info${namespace}`),
    error: logger(`app:error${namespace}`),
    debug: logger(`app:debug${namespace}`),
    request: logger(`app:request${namespace}`),
    task: logger(`app:task${namespace}`),
    db: logger(`app:db${namespace}`),
  };
};

const defaultLogger = createLogger();

export default defaultLogger.info;

export const {
  info,
  error,
  debug,
  request,
  task,
  db,
} = defaultLogger;
