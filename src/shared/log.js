import logger from 'debug';

export default logger('app:info');
export const error = logger('app:error');
export const debug = logger('app:debug');
export const request = logger('app:request');
