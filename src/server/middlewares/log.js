import morgan from 'koa-morgan';

export default morgan(__DEVELOPMENT__ ? 'dev' : 'short');
