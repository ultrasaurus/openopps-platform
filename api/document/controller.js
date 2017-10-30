const log = require('blue-ox')('app:document');
const Router = require('koa-router');
const _ = require('lodash');
const service = require('./service');

var router = new Router();

router.get('/api/upload/get/:id', async (ctx, next) => {
  ctx.body = await service.findOne(ctx.params.id);
});

router.post('/api/upload/create', async (ctx, next) => {
  log.info('Request data => ', ctx.request.body);
  ctx.status = 200;
});

module.exports = router.routes();
