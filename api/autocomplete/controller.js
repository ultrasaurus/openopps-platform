const log = use('log')('app:autocomplete');
const Router = require('koa-router');
const _ = require('lodash');
const service = require('./service');

var router = new Router();

router.get('/api/ac/tag', async (ctx, next) => {
  log.info('ctx.query', ctx.query);
  ctx.body = await service.tagByType(ctx.query.type, ctx.query.q);
});

router.get('/api/ac/user', async (ctx, next) => {
  log.info('ctx.query', ctx.query);
  ctx.body = await service.userByName(ctx.query.q);
});

module.exports = router.routes();
