import convert from 'koa-convert';
import etag from 'koa-etag';

export default convert(etag());
