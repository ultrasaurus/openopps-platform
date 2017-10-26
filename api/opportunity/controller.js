const log = require('blue-ox')('app:opportunity');
const Router = require('koa-router');
const _ = require('lodash');
const service = require('./service');

var router = new Router();

router.get('/api/task', async (ctx, next) => {
  ctx.body = await service.list();
});

router.get('/api/task/:id', async (ctx, next) => {
  var task = await service.findById(ctx.params.id);
  if (ctx.state.user.id === task.userId) { task.isOwner = true; }
  ctx.body = task;
});

router.get('/api/comment/findAllBytaskId/:id', async (ctx, next) => {
  ctx.body = await service.commentsByTaskId(ctx.params.id);
});

router.post('/api/task', async (ctx, next) => {
  log.info('Create opportunity', ctx.request.body);
  ctx.request.body.userId = ctx.session.passport.user;

  // do some validation here...
  var opportunity = await service.createOpportunity(ctx.request.body, function (err, task) {
    log.info(task);
    if (err) {
      // req.flash('error', 'Error.Service.CreateOpportunity.Failed');
      // ctx.status = 400;
      // return ctx.body = { message: err.message || 'Opportunity creation failed.' };
    }
    ctx.body = task;
  });
});

router.put('/api/task/:id', async (ctx, next) => {
  log.info('Edit opportunity', ctx.request.body);
  ctx.status = 200;

  await service.updateOpportunity(ctx.request.body, function (error) {
    if (error) {
      ctx.flash('error', 'Error Updating Opportunity');
      ctx.status = 400;
      log.info(error);
      return ctx.body = null;
    }
    ctx.body = { success: true };
  });
});

router.post('/api/task/copy', async (ctx, next) => {
  log.info('Copy opportunity', ctx.request.body);
  ctx.status = 200;

  await service.copyOpportunity(ctx.request.body, function (error, task) {
    if (error) {
      ctx.flash('error', 'Error Copying Opportunity');
      ctx.status = 400;
      log.info(error);
      return ctx.body = null;
    }
    ctx.body = task;
  });
});

module.exports = router.routes();
