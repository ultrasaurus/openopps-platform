const log = require('blue-ox')('app:opportunity');
const Router = require('koa-router');
const _ = require('lodash');
const service = require('./service');

var router = new Router();

router.get('/api/ac/tag', async (ctx, next) => {
  log.info("ctx.query", ctx.query);
  ctx.body = await service.tagByType(ctx.query.type);
})

module.exports = router.routes();
