import Router from 'koa-66';

const router = new Router();

router.get('/load', { jwt: true }, (ctx) => {
  ctx.status = 200;
});

router.post('/update', { jwt: true }, async (ctx) => {
  ctx.status = 200;
});

router.post('/add', { jwt: true }, async (ctx) => {
  ctx.status = 200;
});

router.post('/delete', { jwt: true }, async (ctx) => {
  ctx.status = 200;
});

export default router;
