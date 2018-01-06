const log = use('log')('app:activity');
const Router = require('koa-router');
const _ = require('lodash');
const auth = require('../auth/auth');
const service = require('./service');

var router = new Router();

router.get('/api/activity/badges', auth, async (ctx, next) => {
  ctx.body = await service.listBadges();
});

router.get('/api/activity/users', auth, async (ctx, next) => {
  ctx.body = await service.newUsersList();
});

router.get('/api/activity/count', auth, async (ctx, next) => {
  ctx.body = await service.getTaskCount(ctx.query['where[state]']);
});

module.exports = router.routes();
