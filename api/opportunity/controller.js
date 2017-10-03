const log = require('blue-ox')('app:opportunity');
const Router = require('koa-router');
const _ = require('lodash');
const service = require('./service');

var router = new Router();

router.get('/api/task', async (ctx, next) => {
  ctx.body = await service.list();
})

router.get('/api/task/:id', async (ctx, next) => {
  ctx.body = await service.findById(ctx.params.id);
})

module.exports = router.routes();
