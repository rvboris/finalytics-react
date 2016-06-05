import { get } from 'lodash';
import mongoose from 'mongoose';
import { createLogger } from '../../shared/log';

export default async(ctx, next) => {
  const token = get(ctx, 'session.token');

  ctx.log = token ? createLogger(mongoose.Types.ObjectId()) : createLogger();

  await next();
};
