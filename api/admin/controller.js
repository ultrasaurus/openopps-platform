const log = require('blue-ox')('app:admin');
const Router = require('koa-router');
const _ = require('lodash');
const service = require('./service');

var router = new Router();

router.get('/api/admin/metrics', async (ctx, next) => {

});

router.get('/api/admin/activities', async (ctx, next) => {
    
});

// '/api/admin/users?page=1'
router.get('/api/admin/users', async (ctx, next) => {
  log.info(ctx.query);
  ctx.status = 200;
});

// '/api/admin/tasks?page=1'
router.get('/api/admin/tasks', async (ctx, next) => {
  log.info(ctx.query);
  ctx.status = 200;
});

module.exports = router.routes();