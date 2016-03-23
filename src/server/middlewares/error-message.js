export default (ctx) => {
  if (ctx.status === 500 & !ctx.body.error) {
    ctx.body = { error: 'global.error.technical' };
  }
};
