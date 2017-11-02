const log = require('blue-ox')('app:activity');
const Router = require('koa-router');
const _ = require('lodash');
const service = require('./service');

var router = new Router();

router.get('/api/activity/badges', async (ctx, next) => {
  ctx.body = await service.listBadges(); 
});

router.get('/api/activity/users', async (ctx, next) => {
  ctx.body = await service.newUsersList();
});

router.get('/api/activity/count', async (ctx, next) => {
  ctx.body = await service.getTaskCount(ctx.query['where[state]']);
});

module.exports = router.routes();