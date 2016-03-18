import convert from 'koa-convert';
import responseTime from 'koa-response-time';

export default convert(responseTime());
