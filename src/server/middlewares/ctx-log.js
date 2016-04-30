import { get } from 'lodash';
import { createLogger } from '../../shared/log';

const hash = s => s.split('').reduce((a, b) => {
  a = ((a << 5) - a) + b.charCodeAt(0);
  return a & a;
}, 0);

export default async(ctx, next) => {
  const token = get(ctx, 'session.token');

  ctx.log = token ? createLogger(hash(token)) : createLogger();

  await next();
};
